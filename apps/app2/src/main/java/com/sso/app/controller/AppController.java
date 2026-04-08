package com.sso.app.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class AppController {

    @Value("${app.name}")
    private String appName;

    @GetMapping("/me")
    public Map<String, Object> getMe(@AuthenticationPrincipal OAuth2User user) {
        return Map.of(
            "username", user.getAttribute("preferred_username") != null
                ? user.getAttribute("preferred_username") : "",
            "email", user.getAttribute("email") != null
                ? user.getAttribute("email") : "",
            "appName", appName
        );
    }
}
