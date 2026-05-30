package com.toptruyen.backend.repository;

import com.toptruyen.backend.entity.UserWallet;
import com.toptruyen.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserWalletRepository extends JpaRepository<UserWallet, Long> {
    Optional<UserWallet> findByUser(User user);
}
