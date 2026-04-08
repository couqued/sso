package com.sso.app.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.servlet.ModelAndView;

import java.util.HashMap;
import java.util.Map;

@Controller
public class DeniedController {

    @Value("${app.name}")
    private String appName;

    @GetMapping("/denied")
    public ModelAndView denied() {
        Map<String, Object> model = new HashMap<>();
        model.put("appName", appName);
        return new ModelAndView("forward:/index.html", model);
    }
}
