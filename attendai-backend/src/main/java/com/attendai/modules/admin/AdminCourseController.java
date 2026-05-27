package com.attendai.modules.admin;

import com.attendai.common.response.ApiResponse;
import com.attendai.modules.admin.CourseDtos.CourseDto;
import com.attendai.modules.admin.CourseDtos.CreateCourseRequest;
import com.attendai.modules.admin.CourseDtos.UpdateCourseRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/courses")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin - Courses")
public class AdminCourseController {

    private final AdminCourseService service;

    @PostMapping
    @Operation(summary = "Create course (API-ADMIN-08)")
    public ResponseEntity<ApiResponse<CourseDto>> create(@Valid @RequestBody CreateCourseRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(service.create(req)));
    }

    @GetMapping
    public ApiResponse<List<CourseDto>> list() {
        return ApiResponse.ok(service.list());
    }

    @GetMapping("/{id}")
    public ApiResponse<CourseDto> get(@PathVariable Long id) {
        return ApiResponse.ok(service.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<CourseDto> update(@PathVariable Long id, @Valid @RequestBody UpdateCourseRequest req) {
        return ApiResponse.ok(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ApiResponse.success("Course deleted");
    }
}
