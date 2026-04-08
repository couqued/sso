package com.sso.app.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Forwards all non-API, non-asset routes to index.html for React SPA routing.
 */
@Controller
public class SpaController {

    @GetMapping(value = {"/", "/{path:[^\\.]*}"})
    public String index() {
        return "forward:/index.html";
    }
}
