package com.nathaniel.travel_guide_app.config;

import java.util.List;
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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
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
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
            "http://localhost:5500",
            "http://127.0.0.1:5500",
            "https://travi-git-master-tanjiro5834s-projects.vercel.app"   // ← Replace this with your actual Vercel production URL
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
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