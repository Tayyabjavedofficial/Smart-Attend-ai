package com.attendai.modules.admin;

import com.attendai.common.response.ApiResponse;
import com.attendai.common.response.PageResponse;
import com.attendai.modules.admin.TeacherDtos.CreateTeacherRequest;
import com.attendai.modules.admin.TeacherDtos.TeacherDto;
import com.attendai.modules.admin.TeacherDtos.UpdateTeacherRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/teachers")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin - Teachers")
public class AdminTeacherController {

    private final AdminTeacherService service;

    @PostMapping
    @Operation(summary = "Create a teacher (API-ADMIN-06)")
    public ResponseEntity<ApiResponse<TeacherDto>> create(@Valid @RequestBody CreateTeacherRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(service.create(req)));
    }

    @GetMapping
    @Operation(summary = "List/search teachers (API-ADMIN-07)")
    public ApiResponse<PageResponse<TeacherDto>> list(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String search,
            Pageable pageable
    ) {
        return ApiResponse.ok(PageResponse.from(service.search(department, search, pageable)));
    }

    @GetMapping("/{id}")
    public ApiResponse<TeacherDto> get(@PathVariable Long id) {
        return ApiResponse.ok(service.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<TeacherDto> update(@PathVariable Long id, @Valid @RequestBody UpdateTeacherRequest req) {
        return ApiResponse.ok(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deactivate(@PathVariable Long id) {
        service.deactivate(id);
        return ApiResponse.success("Teacher deactivated");
    }
}
