package com.toptruyen.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TopTruyenBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(TopTruyenBackendApplication.class, args);
    }
}
