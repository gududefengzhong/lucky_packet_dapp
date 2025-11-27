// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title LuckyPacket
 * @dev 链上幸运红包合约 - 支持随机金额红包的创建、领取和退款
 * @notice 用户可以创建红包，其他人随机领取，未领完可退款
 */
contract LuckyPacket is ReentrancyGuard {
    using Math for uint256;

    // ============ 状态变量 ============
    
    /// @notice 红包 ID 计数器
    uint256 public packetIdCounter;
    
    /// @notice 平台手续费率 (基点，10000 = 100%)
    uint256 public platformFeeRate = 100; // 1%
    
    /// @notice 平台手续费接收地址
    address public platformFeeRecipient;
    
    /// @notice 合约所有者
    address public owner;

    // ============ 数据结构 ============
    
    /// @notice 红包状态枚举
    enum PacketStatus {
        Active,      // 活跃中
        Completed,   // 已领完
        Refunded     // 已退款
    }
    
    /// @notice 红包结构体
    struct Packet {
        uint256 id;                    // 红包 ID
        address creator;               // 创建者地址
        uint256 totalAmount;           // 总金额
        uint256 remainingAmount;       // 剩余金额
        uint256 totalCount;            // 总份数
        uint256 remainingCount;        // 剩余份数
        uint256 createdAt;             // 创建时间
        uint256 expiresAt;             // 过期时间
        string message;                // 祝福语
        PacketStatus status;           // 状态
        bool isRandom;                 // 是否随机金额
    }
    
    /// @notice 领取记录结构体
    struct ClaimRecord {
        address claimer;               // 领取者地址
        uint256 amount;                // 领取金额
        uint256 timestamp;             // 领取时间
    }

    // ============ 存储映射 ============
    
    /// @notice 红包 ID => 红包信息
    mapping(uint256 => Packet) public packets;
    
    /// @notice 红包 ID => 领取记录数组
    mapping(uint256 => ClaimRecord[]) public claimRecords;
    
    /// @notice 红包 ID => 地址 => 是否已领取
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    
    /// @notice 用户地址 => 创建的红包 ID 数组
    mapping(address => uint256[]) public userCreatedPackets;
    
    /// @notice 用户地址 => 领取的红包 ID 数组
    mapping(address => uint256[]) public userClaimedPackets;

    // ============ 事件 ============
    
    /// @notice 红包创建事件
    event PacketCreated(
        uint256 indexed packetId,
        address indexed creator,
        uint256 totalAmount,
        uint256 totalCount,
        uint256 expiresAt,
        bool isRandom,
        string message
    );
    
    /// @notice 红包领取事件
    event PacketClaimed(
        uint256 indexed packetId,
        address indexed claimer,
        uint256 amount,
        uint256 remainingCount,
        uint256 remainingAmount
    );
    
    /// @notice 红包退款事件
    event PacketRefunded(
        uint256 indexed packetId,
        address indexed creator,
        uint256 refundAmount
    );
    
    /// @notice 手续费提取事件
    event PlatformFeeWithdrawn(
        address indexed recipient,
        uint256 amount
    );

    // ============ 修饰器 ============
    
    /// @notice 仅合约所有者可调用
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    /// @notice 红包必须存在且活跃
    modifier packetExists(uint256 _packetId) {
        require(_packetId < packetIdCounter, "Packet does not exist");
        require(packets[_packetId].status == PacketStatus.Active, "Packet not active");
        _;
    }

    // ============ 构造函数 ============
    
    constructor(address _platformFeeRecipient) {
        owner = msg.sender;
        platformFeeRecipient = _platformFeeRecipient;
    }

    // ============ 核心功能 ============
    
    /**
     * @notice 创建红包
     * @param _totalCount 红包总份数
     * @param _expiryDuration 过期时长(秒)
     * @param _message 祝福语
     * @param _isRandom 是否随机金额
     */
    function createPacket(
        uint256 _totalCount,
        uint256 _expiryDuration,
        string memory _message,
        bool _isRandom
    ) external payable nonReentrant returns (uint256) {
        require(msg.value > 0, "Amount must be greater than 0");
        require(_totalCount > 0 && _totalCount <= 100, "Count must be 1-100");
        require(_expiryDuration >= 3600 && _expiryDuration <= 7 days, "Invalid expiry duration");
        require(bytes(_message).length <= 100, "Message too long");
        
        // 计算扣除平台手续费后的实际金额
        uint256 platformFee = (msg.value * platformFeeRate) / 10000;
        uint256 actualAmount = msg.value - platformFee;
        
        require(actualAmount >= _totalCount, "Amount too small for count");
        
        uint256 packetId = packetIdCounter++;
        uint256 expiresAt = block.timestamp + _expiryDuration;
        
        packets[packetId] = Packet({
            id: packetId,
            creator: msg.sender,
            totalAmount: actualAmount,
            remainingAmount: actualAmount,
            totalCount: _totalCount,
            remainingCount: _totalCount,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            message: _message,
            status: PacketStatus.Active,
            isRandom: _isRandom
        });
        
        userCreatedPackets[msg.sender].push(packetId);
        
        emit PacketCreated(
            packetId,
            msg.sender,
            actualAmount,
            _totalCount,
            expiresAt,
            _isRandom,
            _message
        );
        
        return packetId;
    }
    
    /**
     * @notice 领取红包
     * @param _packetId 红包 ID
     */
    function claimPacket(uint256 _packetId) 
        external 
        nonReentrant 
        packetExists(_packetId) 
        returns (uint256) 
    {
        Packet storage packet = packets[_packetId];
        
        require(block.timestamp < packet.expiresAt, "Packet expired");
        require(!hasClaimed[_packetId][msg.sender], "Already claimed");
        require(msg.sender != packet.creator, "Creator cannot claim");
        require(packet.remainingCount > 0, "No packets left");
        
        // 计算领取金额
        uint256 claimAmount = _calculateClaimAmount(_packetId);
        require(claimAmount > 0, "Invalid claim amount");
        
        // 更新状态
        packet.remainingAmount -= claimAmount;
        packet.remainingCount -= 1;
        hasClaimed[_packetId][msg.sender] = true;
        
        // 记录领取信息
        claimRecords[_packetId].push(ClaimRecord({
            claimer: msg.sender,
            amount: claimAmount,
            timestamp: block.timestamp
        }));
        
        userClaimedPackets[msg.sender].push(_packetId);
        
        // 如果领完，标记为完成
        if (packet.remainingCount == 0) {
            packet.status = PacketStatus.Completed;
        }
        
        emit PacketClaimed(
            _packetId,
            msg.sender,
            claimAmount,
            packet.remainingCount,
            packet.remainingAmount
        );
        
        // 转账
        (bool success, ) = payable(msg.sender).call{value: claimAmount}("");
        require(success, "Transfer failed");
        
        return claimAmount;
    }
    
    /**
     * @notice 退款未领完的红包 (仅创建者可调用，且已过期)
     * @param _packetId 红包 ID
     */
    function refundPacket(uint256 _packetId) 
        external 
        nonReentrant 
        packetExists(_packetId) 
        returns (uint256) 
    {
        Packet storage packet = packets[_packetId];
        
        require(msg.sender == packet.creator, "Not packet creator");
        require(block.timestamp >= packet.expiresAt, "Packet not expired yet");
        require(packet.remainingAmount > 0, "Nothing to refund");
        
        uint256 refundAmount = packet.remainingAmount;
        
        // 更新状态
        packet.remainingAmount = 0;
        packet.status = PacketStatus.Refunded;
        
        emit PacketRefunded(_packetId, msg.sender, refundAmount);
        
        // 退款
        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        require(success, "Refund failed");
        
        return refundAmount;
    }

    // ============ 内部函数 ============
    
    /**
     * @notice 计算领取金额（随机或平均）
     * @param _packetId 红包 ID
     * @return 领取金额
     */
    function _calculateClaimAmount(uint256 _packetId) internal view returns (uint256) {
        Packet storage packet = packets[_packetId];
        
        // 如果是最后一个，直接返回剩余金额
        if (packet.remainingCount == 1) {
            return packet.remainingAmount;
        }
        
        // 如果是固定金额，平均分配
        if (!packet.isRandom) {
            return packet.remainingAmount / packet.remainingCount;
        }
        
        // 随机金额：使用改进的随机算法
        // 保证每人至少得到 1 wei，最多得到剩余平均值的 2 倍
        uint256 avgAmount = packet.remainingAmount / packet.remainingCount;
        uint256 maxAmount = avgAmount * 2;
        
        // 确保最后的人也能领到
        if (maxAmount > packet.remainingAmount - (packet.remainingCount - 1)) {
            maxAmount = packet.remainingAmount - (packet.remainingCount - 1);
        }
        
        // 生成伪随机数
        uint256 random = _generateRandom(_packetId, msg.sender);
        uint256 claimAmount = 1 + (random % maxAmount);
        
        // 确保不超过剩余金额
        if (claimAmount > packet.remainingAmount - (packet.remainingCount - 1)) {
            claimAmount = packet.remainingAmount - (packet.remainingCount - 1);
        }
        
        return claimAmount;
    }
    
    /**
     * @notice 生成伪随机数
     * @param _packetId 红包 ID
     * @param _claimer 领取者地址
     * @return 随机数
     */
    function _generateRandom(uint256 _packetId, address _claimer) internal view returns (uint256) {
        return uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    _packetId,
                    _claimer,
                    packets[_packetId].remainingCount,
                    claimRecords[_packetId].length
                )
            )
        );
    }

    // ============ 查询函数 ============
    
    /**
     * @notice 获取红包详细信息
     * @param _packetId 红包 ID
     */
    function getPacket(uint256 _packetId) 
        external 
        view 
        returns (Packet memory) 
    {
        require(_packetId < packetIdCounter, "Packet does not exist");
        return packets[_packetId];
    }
    
    /**
     * @notice 获取红包领取记录
     * @param _packetId 红包 ID
     */
    function getClaimRecords(uint256 _packetId) 
        external 
        view 
        returns (ClaimRecord[] memory) 
    {
        return claimRecords[_packetId];
    }
    
    /**
     * @notice 获取用户创建的红包列表
     * @param _user 用户地址
     */
    function getUserCreatedPackets(address _user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userCreatedPackets[_user];
    }
    
    /**
     * @notice 获取用户领取的红包列表
     * @param _user 用户地址
     */
    function getUserClaimedPackets(address _user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userClaimedPackets[_user];
    }
    
    /**
     * @notice 检查用户是否已领取某个红包
     * @param _packetId 红包 ID
     * @param _user 用户地址
     */
    function hasUserClaimed(uint256 _packetId, address _user) 
        external 
        view 
        returns (bool) 
    {
        return hasClaimed[_packetId][_user];
    }
    
    /**
     * @notice 获取活跃红包总数
     */
    function getActivePacketsCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < packetIdCounter; i++) {
            if (packets[i].status == PacketStatus.Active && 
                block.timestamp < packets[i].expiresAt) {
                count++;
            }
        }
        return count;
    }

    // ============ 管理函数 ============
    
    /**
     * @notice 设置平台手续费率 (仅所有者)
     * @param _newRate 新的手续费率 (基点)
     */
    function setPlatformFeeRate(uint256 _newRate) external onlyOwner {
        require(_newRate <= 500, "Fee rate too high"); // 最高 5%
        platformFeeRate = _newRate;
    }
    
    /**
     * @notice 设置平台手续费接收地址 (仅所有者)
     * @param _newRecipient 新的接收地址
     */
    function setPlatformFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Invalid address");
        platformFeeRecipient = _newRecipient;
    }
    
    /**
     * @notice 提取平台手续费 (仅所有者)
     */
    function withdrawPlatformFee() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        
        // 计算所有活跃红包的总金额
        uint256 lockedAmount = 0;
        for (uint256 i = 0; i < packetIdCounter; i++) {
            if (packets[i].status == PacketStatus.Active) {
                lockedAmount += packets[i].remainingAmount;
            }
        }
        
        uint256 withdrawableAmount = balance - lockedAmount;
        require(withdrawableAmount > 0, "No fees to withdraw");
        
        emit PlatformFeeWithdrawn(platformFeeRecipient, withdrawableAmount);
        
        (bool success, ) = payable(platformFeeRecipient).call{value: withdrawableAmount}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @notice 转移合约所有权
     * @param _newOwner 新所有者地址
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }

    // ============ 接收函数 ============
    
    /// @notice 接收 ETH/BNB
    receive() external payable {}
}
