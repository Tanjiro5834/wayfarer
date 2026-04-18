package com.nathaniel.travel_guide_app.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                .requestMatchers("/api/admin/**").permitAll()

                .requestMatchers(
                    "/",
                    "/index.html",
                    "/favicon.ico",
                    "/images/**",

                    "/admin/**",
                    "/admin.html",
                    "/admin.css",
                    "/admin.js",

                    "/style.css",
                    "/script.js"
                ).permitAll()

                .requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login").permitAll()
                .requestMatchers(HttpMethod.GET,
                    "/api/countries",
                    "/api/countries/**",
                    "/api/entry-requirements/**",
                    "/api/budgets/**",
                    "/api/packing-checklists/**"
                ).permitAll()

                .anyRequest().permitAll()

                // .requestMatchers("/api/auth/me").authenticated()
                // .requestMatchers("/api/saved-destinations/**").authenticated()

                //.anyRequest().authenticated()
            )
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable());

        return http.build();
    }
}