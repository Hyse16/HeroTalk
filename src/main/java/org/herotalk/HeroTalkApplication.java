package org.herotalk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class HeroTalkApplication {

    public static void main(String[] args) {
        SpringApplication.run(HeroTalkApplication.class, args);
    }
}
