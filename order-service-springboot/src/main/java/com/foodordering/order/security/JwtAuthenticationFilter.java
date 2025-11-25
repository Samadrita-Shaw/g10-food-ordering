package com.foodordering.order.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) 
            throws ServletException, IOException {
        
        final String authorizationHeader = request.getHeader("Authorization");
        String requestPath = request.getRequestURI();
        
        // Enhanced logging for debugging
        logger.info("JWT Filter - Processing request to: " + requestPath);
        logger.info("JWT Filter - Authorization header present: " + (authorizationHeader != null));

        String userId = null;
        String jwt = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            logger.info("JWT token extracted, length: " + jwt.length());
            try {
                userId = jwtUtil.getUserIdFromToken(jwt);
                logger.info("User ID extracted from token: " + userId);
            } catch (Exception e) {
                logger.error("Failed to extract user ID from token: " + e.getMessage(), e);
            }
        } else {
            logger.info("No Bearer token found in Authorization header");
        }

        if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                if (jwtUtil.validateToken(jwt)) {
                    String role = jwtUtil.getRoleFromToken(jwt);
                    logger.info("Token validated successfully for user: " + userId + " with role: " + role);
                    
                    // Ensure proper role formatting - avoid double ROLE_ prefix
                    String formattedRole;
                    if (role != null && role.startsWith("ROLE_")) {
                        formattedRole = role; // Already has ROLE_ prefix
                    } else {
                        formattedRole = "ROLE_" + (role != null ? role : "USER");
                    }
                    
                    SimpleGrantedAuthority authority = new SimpleGrantedAuthority(formattedRole);
                    logger.info("Formatted authority: " + formattedRole);
                    
                    UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(userId, null, Collections.singletonList(authority));
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    logger.info("Authentication set in SecurityContext for user: " + userId + " with authority: " + formattedRole);
                } else {
                    logger.error("JWT token validation failed for user: " + userId);
                }
            } catch (Exception e) {
                logger.error("Error during JWT token validation: " + e.getMessage(), e);
            }
        } else if (userId == null) {
            logger.info("No user ID found in token");
        } else {
            logger.info("Authentication already exists in SecurityContext");
        }

        filterChain.doFilter(request, response);
    }
}