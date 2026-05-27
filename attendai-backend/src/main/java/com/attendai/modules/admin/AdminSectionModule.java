package com.attendai.modules.admin;

import com.attendai.common.exception.ResourceNotFoundException;
import com.attendai.common.response.ApiResponse;
import com.attendai.domain.course.Section;
import com.attendai.domain.course.SectionRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Sections are simple enough to keep all three layers (DTO, service, controller)
 * in one file. Other modules follow the same split-file pattern; this is just
 * a tighter footprint where the surface area doesn't justify the spread.
 */
public class AdminSectionModule {

    public record CreateSectionRequest(
            @NotBlank @Size(max = 50) String sectionName,
            Integer semester,
            @Size(max = 80) String department
    ) {}

    public record SectionDto(Long id, String sectionName, Integer semester, String department) {
        public static SectionDto from(Section s) {
            return new SectionDto(s.getId(), s.getSectionName(), s.getSemester(), s.getDepartment());
        }
    }

    @Service
    @RequiredArgsConstructor
    public static class AdminSectionService {

        private final SectionRepository sectionRepository;

        @Transactional
        public SectionDto create(CreateSectionRequest req) {
            Section s = sectionRepository.save(Section.builder()
                    .sectionName(req.sectionName())
                    .semester(req.semester())
                    .department(req.department())
                    .build());
            return SectionDto.from(s);
        }

        @Transactional(readOnly = true)
        public List<SectionDto> list(String department) {
            var list = department != null
                    ? sectionRepository.findByDepartment(department)
                    : sectionRepository.findAll();
            return list.stream().map(SectionDto::from).toList();
        }

        @Transactional(readOnly = true)
        public SectionDto get(Long id) {
            return sectionRepository.findById(id).map(SectionDto::from)
                    .orElseThrow(() -> new ResourceNotFoundException("Section", id));
        }

        @Transactional
        public void delete(Long id) {
            if (!sectionRepository.existsById(id)) {
                throw new ResourceNotFoundException("Section", id);
            }
            sectionRepository.deleteById(id);
        }
    }

    @RestController
    @RequestMapping("/api/admin/sections")
    @RequiredArgsConstructor
    @PreAuthorize("hasRole('ADMIN')")
    @Tag(name = "Admin - Sections")
    public static class AdminSectionController {

        private final AdminSectionService service;

        @PostMapping
        @Operation(summary = "Create section (API-ADMIN-09)")
        public ResponseEntity<ApiResponse<SectionDto>> create(@Valid @RequestBody CreateSectionRequest req) {
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(service.create(req)));
        }

        @GetMapping
        public ApiResponse<List<SectionDto>> list(@RequestParam(required = false) String department) {
            return ApiResponse.ok(service.list(department));
        }

        @GetMapping("/{id}")
        public ApiResponse<SectionDto> get(@PathVariable Long id) {
            return ApiResponse.ok(service.get(id));
        }

        @DeleteMapping("/{id}")
        public ApiResponse<Void> delete(@PathVariable Long id) {
            service.delete(id);
            return ApiResponse.success("Section deleted");
        }
    }
}
