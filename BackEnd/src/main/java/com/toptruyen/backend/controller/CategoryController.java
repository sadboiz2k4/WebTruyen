package com.toptruyen.backend.controller;

import com.toptruyen.backend.dto.CategoryItem;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @GetMapping
    public List<CategoryItem> getCategories() {
        return List.of(
                new CategoryItem("all", "Tat ca", true),
                new CategoryItem("action", "Action", false),
                new CategoryItem("adventure", "Adventure", false),
                new CategoryItem("anime", "Anime", false),
                new CategoryItem("chuyen-sinh", "Chuyen Sinh", true),
                new CategoryItem("comedy", "Comedy", false),
                new CategoryItem("co-dai", "Co Dai", true),
                new CategoryItem("manhua", "Manhua", true),
                new CategoryItem("manhwa", "Manhwa", true),
                new CategoryItem("ngon-tinh", "Ngon Tinh", true),
                new CategoryItem("romance", "Romance", true),
                new CategoryItem("xuyen-khong", "Xuyen Khong", true),
                new CategoryItem("tu-tien", "Tu Tien", true)
        );
    }
}
