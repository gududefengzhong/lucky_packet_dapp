// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/LuckyPacket.sol";

/**
 * @title LuckyPacketTest
 * @dev Foundry 测试套件 - 测试 LuckyPacket 合约的核心功能和边界条件
 */
contract LuckyPacketTest is Test {
    LuckyPacket public luckyPacket;
    
    address public owner;
    address public feeRecipient;
    address public user1;
    address public user2;
    address public user3;
    
    uint256 constant INITIAL_BALANCE = 100 ether;
    
    // 事件声明（用于测试）
    event PacketCreated(
        uint256 indexed packetId,
        address indexed creator,
        uint256 totalAmount,
        uint256 totalCount,
        uint256 expiresAt,
        bool isRandom,
        string message
    );
    
    event PacketClaimed(
        uint256 indexed packetId,
        address indexed claimer,
        uint256 amount,
        uint256 remainingCount,
        uint256 remainingAmount
    );
    
    event PacketRefunded(
        uint256 indexed packetId,
        address indexed creator,
        uint256 refundAmount
    );

    function setUp() public {
        // 设置测试账户
        owner = address(this);
        feeRecipient = makeAddr("feeRecipient");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        user3 = makeAddr("user3");
        
        // 部署合约
        luckyPacket = new LuckyPacket(feeRecipient);
        
        // 给测试账户充值
        vm.deal(owner, INITIAL_BALANCE);
        vm.deal(user1, INITIAL_BALANCE);
        vm.deal(user2, INITIAL_BALANCE);
        vm.deal(user3, INITIAL_BALANCE);
    }

    // ============ 创建红包测试 ============
    
    function testCreatePacketSuccess() public {
        uint256 amount = 1 ether;
        uint256 count = 5;
        uint256 duration = 1 days;
        string memory message = "Happy New Year!";
        
        vm.expectEmit(true, true, false, true);
        emit PacketCreated(0, owner, 0.99 ether, count, block.timestamp + duration, true, message);
        
        uint256 packetId = luckyPacket.createPacket{value: amount}(
            count,
            duration,
            message,
            true
        );
        
        assertEq(packetId, 0);
        
        LuckyPacket.Packet memory packet = luckyPacket.getPacket(0);
        assertEq(packet.creator, owner);
        assertEq(packet.totalAmount, 0.99 ether); // 扣除 1% 手续费
        assertEq(packet.totalCount, count);
        assertEq(packet.remainingCount, count);
        assertTrue(packet.isRandom);
    }
    
    function testCreatePacketWithZeroAmount() public {
        vm.expectRevert("Amount must be greater than 0");
        luckyPacket.createPacket{value: 0}(5, 1 days, "test", true);
    }
    
    function testCreatePacketWithInvalidCount() public {
        // 测试 count = 0
        vm.expectRevert("Count must be 1-100");
        luckyPacket.createPacket{value: 1 ether}(0, 1 days, "test", true);
        
        // 测试 count > 100
        vm.expectRevert("Count must be 1-100");
        luckyPacket.createPacket{value: 1 ether}(101, 1 days, "test", true);
    }
    
    function testCreatePacketWithInvalidDuration() public {
        // 测试过短的过期时间
        vm.expectRevert("Invalid expiry duration");
        luckyPacket.createPacket{value: 1 ether}(5, 3599, "test", true);
        
        // 测试过长的过期时间
        vm.expectRevert("Invalid expiry duration");
        luckyPacket.createPacket{value: 1 ether}(5, 8 days, "test", true);
    }
    
    function testCreatePacketWithLongMessage() public {
        string memory longMessage = "This is a very long message that exceeds the maximum allowed length of 100 characters for the red packet greeting";
        
        vm.expectRevert("Message too long");
        luckyPacket.createPacket{value: 1 ether}(5, 1 days, longMessage, true);
    }
    
    function testCreatePacketWithInsufficientAmount() public {
        vm.expectRevert("Amount too small for count");
        luckyPacket.createPacket{value: 10}(100, 1 days, "test", true);
    }

    // ============ 领取红包测试 ============
    
    function testClaimPacketSuccess() public {
        // 创建红包
        uint256 packetId = luckyPacket.createPacket{value: 1 ether}(
            5,
            1 days,
            "Test Packet",
            true
        );
        
        // user1 领取红包
        vm.startPrank(user1);
        uint256 balanceBefore = user1.balance;
        
        vm.expectEmit(true, true, false, false);
        emit PacketClaimed(packetId, user1, 0, 4, 0);
        
        uint256 claimedAmount = luckyPacket.claimPacket(packetId);
        
        uint256 balanceAfter = user1.balance;
        assertEq(balanceAfter - balanceBefore, claimedAmount);
        assertTrue(claimedAmount > 0);
        
        vm.stopPrank();
        
        // 验证红包状态
        LuckyPacket.Packet memory packet = luckyPacket.getPacket(packetId);
        assertEq(packet.remainingCount, 4);
        assertTrue(luckyPacket.hasUserClaimed(packetId, user1));
    }
    
    function testClaimMultipleUsers() public {
        // 创建红包
        uint256 packetId = luckyPacket.createPacket{value: 1 ether}(
            3,
            1 days,
            "Multi User Test",
            true
        );
        
        // user1 领取
        vm.prank(user1);
        luckyPacket.claimPacket(packetId);
        
        // user2 领取
        vm.prank(user2);
        luckyPacket.claimPacket(packetId);
        
        // user3 领取（最后一个）
        vm.prank(user3);
        luckyPacket.claimPacket(packetId);
        
        // 验证红包已领完
        LuckyPacket.Packet memory packet = luckyPacket.getPacket(packetId);
        assertEq(packet.remainingCount, 0);
        assertEq(uint(packet.status), uint(LuckyPacket.PacketStatus.Completed));
        
        // 验证领取记录
        LuckyPacket.ClaimRecord[] memory records = luckyPacket.getClaimRecords(packetId);
        assertEq(records.length, 3);
    }
    
    function testClaimPacketTwice() public {
        uint256 packetId = luckyPacket.createPacket{value: 1 ether}(
            5,
            1 days,
            "Test",
            true
        );
        
        vm.startPrank(user1);
        luckyPacket.claimPacket(packetId);
        
        // 尝试第二次领取
        vm.expectRevert("Already claimed");
        luckyPacket.claimPacket(packetId);
        
        vm.stopPrank();
    }
    
    function testCreatorCannotClaim() public {
        uint256 packetId = luckyPacket.createPacket{value: 1 ether}(
            5,
            1 days,
            "Test",
            true
        );
        
        vm.expectRevert("Creator cannot claim");
        luckyPacket.claimPacket(packetId);
    }
    
    function testClaimExpiredPacket() public {
        uint256 packetId = luckyPacket.createPacket{value: 1 ether}(
            5,
            1 days,
            "Test",
            true
        );
        
        // 快进时间到过期后
        vm.warp(block.timestamp + 2 days);
        
        vm.prank(user1);
        vm.expectRevert("Packet expired");
        luckyPacket.claimPacket(packetId);
    }
    
    function testClaimNonExistentPacket() public {
        vm.prank(user1);
        vm.expectRevert("Packet does not exist");
        luckyPacket.claimPacket(999);
    }

    // ============ 固定金额红包测试 ============
    
    function testCreateFixedAmountPacket() public {
        uint256 packetId = luckyPacket.createPacket{value: 1 ether}(
            10,
            1 days,
            "Fixed Amount",
            false // 固定金额
        );
        
        uint256 expectedAmount = 0.99 ether / 10; // 每份金额相同
        
        // user1 领取
        vm.prank(user1);
        uint256 amount1 = luckyPacket.claimPacket(packetId);
        assertEq(amount1, expectedAmount);
        
        // user2 领取
        vm.prank(user2);
        uint256 amount2 = luckyPacket.claimPacket(packetId);
        assertEq(amount2, expectedAmount);
    }

    // ============ 退款测试 ============
    
    function testRefundExpiredPacket() public {
        uint256 packetId = luckyPacket.createPacket{value: 1 ether}(
            5,
            1 days,
            "Refund Test",
            true
        );
        
        // user1 领取一个
        vm.prank(user1);
        luckyPacket.claimPacket(packetId);
        
        // 快进到过期
        vm.warp(block.timestamp + 2 days);
        
        // 退款
        uint256 balanceBefore = owner.balance;
        
        vm.expectEmit(true, true, false, false);
        emit PacketRefunded(packetId, owner, 0);
        
        uint256 refundAmount = luckyPacket.refundPacket(packetId);
        
        uint256 balanceAfter = owner.balance;
        assertEq(balanceAfter - balanceBefore, refundAmount);
        assertTrue(refundAmount > 0);
        
        // 验证状态
        LuckyPacket.Packet memory packet = luckyPacket.getPacket(packetId);
        assertEq(uint(packet.status), uint(LuckyPacket.PacketStatus.Refunded));
        assertEq(packet.remainingAmount, 0);
    }
    
    function testRefundBeforeExpiry() public {
        uint256 packetId = luckyPacket.createPacket{value: 1 ether}(
            5,
            1 days,
            "Test",
            true
        );
        
        vm.expectRevert("Packet not expired yet");
        luckyPacket.refundPacket(packetId);
    }
    
    function testRefundByNonCreator() public {
        uint256 packetId = luckyPacket.createPacket{value: 1 ether}(
            5,
            1 days,
            "Test",
            true
        );
        
        vm.warp(block.timestamp + 2 days);
        
        vm.prank(user1);
        vm.expectRevert("Not packet creator");
        luckyPacket.refundPacket(packetId);
    }
    
    function testRefundCompletedPacket() public {
        uint256 packetId = luckyPacket.createPacket{value: 1 ether}(
            2,
            1 days,
            "Test",
            true
        );
        
        // 全部领取完
        vm.prank(user1);
        luckyPacket.claimPacket(packetId);
        
        vm.prank(user2);
        luckyPacket.claimPacket(packetId);
        
        // 快进到过期
        vm.warp(block.timestamp + 2 days);
        
        // 尝试退款
        vm.expectRevert("Nothing to refund");
        luckyPacket.refundPacket(packetId);
    }

    // ============ 查询功能测试 ============
    
    function testGetUserCreatedPackets() public {
        luckyPacket.createPacket{value: 1 ether}(5, 1 days, "Packet 1", true);
        luckyPacket.createPacket{value: 1 ether}(5, 1 days, "Packet 2", true);
        
        uint256[] memory createdPackets = luckyPacket.getUserCreatedPackets(owner);
        assertEq(createdPackets.length, 2);
        assertEq(createdPackets[0], 0);
        assertEq(createdPackets[1], 1);
    }
    
    function testGetUserClaimedPackets() public {
        uint256 packetId1 = luckyPacket.createPacket{value: 1 ether}(5, 1 days, "Packet 1", true);
        uint256 packetId2 = luckyPacket.createPacket{value: 1 ether}(5, 1 days, "Packet 2", true);
        
        vm.startPrank(user1);
        luckyPacket.claimPacket(packetId1);
        luckyPacket.claimPacket(packetId2);
        vm.stopPrank();
        
        uint256[] memory claimedPackets = luckyPacket.getUserClaimedPackets(user1);
        assertEq(claimedPackets.length, 2);
    }
    
    function testGetActivePacketsCount() public {
        luckyPacket.createPacket{value: 1 ether}(5, 1 days, "Active 1", true);
        luckyPacket.createPacket{value: 1 ether}(5, 1 days, "Active 2", true);
        
        uint256 activeCount = luckyPacket.getActivePacketsCount();
        assertEq(activeCount, 2);
    }

    // ============ 管理功能测试 ============
    
    function testSetPlatformFeeRate() public {
        luckyPacket.setPlatformFeeRate(200); // 2%
        assertEq(luckyPacket.platformFeeRate(), 200);
    }
    
    function testSetPlatformFeeRateTooHigh() public {
        vm.expectRevert("Fee rate too high");
        luckyPacket.setPlatformFeeRate(600); // 6%
    }
    
    function testSetPlatformFeeRateByNonOwner() public {
        vm.prank(user1);
        vm.expectRevert("Not owner");
        luckyPacket.setPlatformFeeRate(200);
    }
    
    function testSetPlatformFeeRecipient() public {
        address newRecipient = makeAddr("newRecipient");
        luckyPacket.setPlatformFeeRecipient(newRecipient);
        assertEq(luckyPacket.platformFeeRecipient(), newRecipient);
    }
    
    function testWithdrawPlatformFee() public {
        // 创建一些红包以产生手续费
        luckyPacket.createPacket{value: 1 ether}(5, 1 days, "Test 1", true);
        luckyPacket.createPacket{value: 1 ether}(5, 1 days, "Test 2", true);
        
        uint256 balanceBefore = feeRecipient.balance;
        luckyPacket.withdrawPlatformFee();
        uint256 balanceAfter = feeRecipient.balance;
        
        assertTrue(balanceAfter > balanceBefore);
    }
    
    function testTransferOwnership() public {
        address newOwner = makeAddr("newOwner");
        luckyPacket.transferOwnership(newOwner);
        assertEq(luckyPacket.owner(), newOwner);
    }

    // ============ 边界条件测试 ============
    
    function testMinimumPacketCount() public {
        uint256 packetId = luckyPacket.createPacket{value: 0.01 ether}(
            1,
            1 days,
            "Single",
            true
        );
        
        LuckyPacket.Packet memory packet = luckyPacket.getPacket(packetId);
        assertEq(packet.totalCount, 1);
    }
    
    function testMaximumPacketCount() public {
        uint256 packetId = luckyPacket.createPacket{value: 10 ether}(
            100,
            1 days,
            "Max",
            true
        );
        
        LuckyPacket.Packet memory packet = luckyPacket.getPacket(packetId);
        assertEq(packet.totalCount, 100);
    }
    
    function testLastClaimGetsRemainingAmount() public {
        uint256 packetId = luckyPacket.createPacket{value: 1 ether}(
            2,
            1 days,
            "Test",
            true
        );
        
        vm.prank(user1);
        uint256 amount1 = luckyPacket.claimPacket(packetId);
        
        vm.prank(user2);
        uint256 amount2 = luckyPacket.claimPacket(packetId);
        
        // 验证总金额正确
        assertEq(amount1 + amount2, 0.99 ether);
    }

    // ============ 压力测试 ============
    
    function testMultiplePacketsAndClaims() public {
        // 创建多个红包
        for (uint i = 0; i < 5; i++) {
            luckyPacket.createPacket{value: 1 ether}(
                10,
                1 days,
                string(abi.encodePacked("Packet ", i)),
                true
            );
        }
        
        // 多个用户领取
        for (uint i = 0; i < 5; i++) {
            vm.prank(user1);
            luckyPacket.claimPacket(i);
            
            vm.prank(user2);
            luckyPacket.claimPacket(i);
        }
        
        // 验证
        assertEq(luckyPacket.getUserClaimedPackets(user1).length, 5);
        assertEq(luckyPacket.getUserClaimedPackets(user2).length, 5);
    }
}
