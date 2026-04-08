package com.sso.portal.controller;

import com.sso.portal.config.AppRegistry;
import com.sso.portal.config.MenuConfig;
import com.sso.portal.model.AppInfo;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api")
public class RedirectController {

    private final AppRegistry appRegistry;
    private final MenuConfig menuConfig;

    public RedirectController(AppRegistry appRegistry, MenuConfig menuConfig) {
        this.appRegistry = appRegistry;
        this.menuConfig = menuConfig;
    }

    @GetMapping("/redirect/{appId}")
    public ResponseEntity<Void> redirect(
            @PathVariable String appId,
            @AuthenticationPrincipal OAuth2User user) {

        AppInfo app = appRegistry.findById(appId)
            .orElseThrow(() -> new IllegalArgumentException("Unknown app: " + appId));

        List<String> roles = PortalController.extractRoles(user);

        if (roles.contains(app.getRequiredRole())) {
            // 허용된 메뉴 목록을 쿼리 파라미터로 앱에 전달
            List<String> allowedMenus = menuConfig.getAllowedMenuIds(roles);
            String perms = String.join(",", allowedMenus);
            return ResponseEntity.status(302)
                .location(URI.create(app.getUrl() + "/?portal_perms=" + perms))
                .build();
        } else {
            return ResponseEntity.status(302)
                .location(URI.create(app.getUrl() + "/denied?from=portal"))
                .build();
        }
    }
}
