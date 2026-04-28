package com.nathaniel.travel_guide_app.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {
        
    private final JwtAuthenticationFilter jwtAuthFilter;

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
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
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
                    "/script.js",
                    "/authentication.html",   // ← new
                    "/authentication.css",    // ← new
                    "/authentication.js"  
                ).permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login").permitAll()
                .requestMatchers(HttpMethod.GET,
                    "/api/countries",
                    "/api/countries/**",
                    "/api/entry-requirements/**",
                    "/api/budgets/**",
                    "/api/packing-checklists/**"
                ).permitAll()
                // Protected endpoints
                .requestMatchers("/api/auth/me").authenticated()
                .requestMatchers("/api/saved-destinations/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/trips/**").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/trips/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/trips/**").authenticated()
                .requestMatchers("/api/trip-days/**").authenticated()
                .requestMatchers("/api/trip-activities/**").authenticated()
                .anyRequest().authenticated()
            )
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable());

        return http.build();
    }
}