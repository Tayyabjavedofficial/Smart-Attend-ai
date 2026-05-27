package com.attendai.modules.admin;

import com.attendai.common.response.ApiResponse;
import com.attendai.common.response.PageResponse;
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
@RequestMapping("/api/admin/students")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin - Students", description = "Manage student records")
public class AdminStudentController {

    private final AdminStudentService service;

    @PostMapping
    @Operation(summary = "Create a new student (API-ADMIN-02)")
    public ResponseEntity<ApiResponse<StudentDto>> create(@Valid @RequestBody CreateStudentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(service.create(req)));
    }

    @GetMapping
    @Operation(summary = "List/search students (API-ADMIN-03)")
    public ApiResponse<PageResponse<StudentDto>> list(
            @RequestParam(required = false) Long sectionId,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String search,
            Pageable pageable
    ) {
        return ApiResponse.ok(PageResponse.from(service.search(sectionId, department, search, pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get one student by id")
    public ApiResponse<StudentDto> get(@PathVariable Long id) {
        return ApiResponse.ok(service.get(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a student (API-ADMIN-04)")
    public ApiResponse<StudentDto> update(@PathVariable Long id, @Valid @RequestBody UpdateStudentRequest req) {
        return ApiResponse.ok(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deactivate a student (API-ADMIN-05)")
    public ApiResponse<Void> deactivate(@PathVariable Long id) {
        service.deactivate(id);
        return ApiResponse.success("Student deactivated");
    }
}
