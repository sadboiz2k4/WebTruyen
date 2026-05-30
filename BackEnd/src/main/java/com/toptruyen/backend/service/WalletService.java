package com.toptruyen.backend.service;

import com.toptruyen.backend.entity.User;
import com.toptruyen.backend.entity.UserWallet;
import com.toptruyen.backend.entity.WalletTransaction;
import com.toptruyen.backend.repository.UserRepository;
import com.toptruyen.backend.repository.UserWalletRepository;
import com.toptruyen.backend.repository.WalletTransactionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class WalletService {

    private final UserWalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public WalletService(
            UserWalletRepository walletRepository,
            WalletTransactionRepository transactionRepository,
            UserRepository userRepository
    ) {
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    /**
     * Lấy thông tin ví của user
     */
    @Transactional
    public UserWallet getWallet(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        return walletRepository.findByUser(user)
                .orElseGet(() -> walletRepository.save(new UserWallet(user)));
    }

    /**
     * Lấy số dư ví
     */
    public long getBalance(Long userId) {
        Long bal = getWallet(userId).getBalance();
        return bal != null ? bal : 0L;
    }

    /**
     * Nạp tiền vào ví
     */
    @Transactional
    public WalletTransaction depositMoney(Long userId, Long amount, String reason) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Số tiền phải lớn hơn 0");
        }

        UserWallet wallet = getWallet(userId);

        wallet.setBalance((wallet.getBalance() != null ? wallet.getBalance() : 0L) + amount);
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);

        WalletTransaction transaction = new WalletTransaction(userId, amount, "DEPOSIT");
        transaction.setDescription(reason);
        return transactionRepository.save(transaction);
    }

    /**
     * Rút tiền từ ví
     */
    @Transactional
    public WalletTransaction withdrawMoney(Long userId, Long amount, String reason) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Số tiền phải lớn hơn 0");
        }

        UserWallet wallet = getWallet(userId);

        long currentBalance = wallet.getBalance() != null ? wallet.getBalance() : 0L;
        if (currentBalance < amount) {
            throw new IllegalArgumentException("Số dư không đủ");
        }

        wallet.setBalance(currentBalance - amount);
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);

        WalletTransaction transaction = new WalletTransaction(userId, amount, "WITHDRAW");
        transaction.setDescription(reason);
        return transactionRepository.save(transaction);
    }

    /**
     * Lấy lịch sử giao dịch
     */
    public Page<WalletTransaction> getTransactionHistory(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return transactionRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    /**
     * Ủng hộ tác giả với phí sàn 40% (tác giả nhận 60%)
     * Returns [authorReceives, platformFee]
     */
    @Transactional
    public long[] donateMoney(Long fromUserId, Long toUserId, Long amount, String description) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Số tiền phải lớn hơn 0");
        }

        User fromUser = userRepository.findById(fromUserId)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng nguồn không tồn tại"));

        User toUser = userRepository.findById(toUserId)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng đích không tồn tại"));

        UserWallet fromWallet = walletRepository.findByUser(fromUser)
                .orElseThrow(() -> new IllegalArgumentException("Ví nguồn không tồn tại"));

        UserWallet toWallet = walletRepository.findByUser(toUser)
                .orElseThrow(() -> new IllegalArgumentException("Ví đích không tồn tại"));

        if (fromWallet.getBalance() < amount) {
            throw new IllegalArgumentException("Số dư không đủ");
        }

        long platformFee = amount * 40 / 100;
        long authorReceives = amount - platformFee;

        fromWallet.setBalance(fromWallet.getBalance() - amount);
        fromWallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(fromWallet);

        toWallet.setBalance(toWallet.getBalance() + authorReceives);
        toWallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(toWallet);

        WalletTransaction transaction = new WalletTransaction(fromUserId, amount, "DONATE");
        transaction.setDescription(description);
        transactionRepository.save(transaction);

        return new long[]{authorReceives, platformFee};
    }

    /**
     * Chuyển tiền giữa các tài khoản
     */
    @Transactional
    public WalletTransaction transferMoney(Long fromUserId, Long toUserId, Long amount, String description) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Số tiền phải lớn hơn 0");
        }

        User fromUser = userRepository.findById(fromUserId)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng nguồn không tồn tại"));

        User toUser = userRepository.findById(toUserId)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng đích không tồn tại"));

        UserWallet fromWallet = walletRepository.findByUser(fromUser)
                .orElseThrow(() -> new IllegalArgumentException("Ví nguồn không tồn tại"));

        UserWallet toWallet = walletRepository.findByUser(toUser)
                .orElseThrow(() -> new IllegalArgumentException("Ví đích không tồn tại"));

        if (fromWallet.getBalance() < amount) {
            throw new IllegalArgumentException("Số dư không đủ");
        }

        // Trừ tiền từ người gửi
        fromWallet.setBalance(fromWallet.getBalance() - amount);
        fromWallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(fromWallet);

        // Cộng tiền cho người nhận
        toWallet.setBalance(toWallet.getBalance() + amount);
        toWallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(toWallet);

        // Ghi nhận giao dịch
        WalletTransaction transaction = new WalletTransaction(fromUserId, amount, "TRANSFER");
        transaction.setDescription(description);
        return transactionRepository.save(transaction);
    }
}
