package com.toptruyen.backend.repository;

import com.toptruyen.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByDisplayName(String displayName);
    boolean existsByEmail(String email);
}
