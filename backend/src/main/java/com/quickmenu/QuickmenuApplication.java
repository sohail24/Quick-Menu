package com.quickmenu;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class QuickmenuApplication {

	public static void main(String[] args) {
		SpringApplication.run(QuickmenuApplication.class, args);
	}

}
