package com.attendai.modules.admin;

import com.attendai.common.exception.ApiException;
import com.attendai.common.exception.ResourceNotFoundException;
import com.attendai.common.response.ApiResponse;
import com.attendai.domain.course.Batch;
import com.attendai.domain.course.BatchRepository;
import com.attendai.domain.course.Section;
import com.attendai.domain.course.SectionRepository;
import com.attendai.domain.user.StudentRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * A batch is a student cohort that owns {@link Section}s across semesters
 * 1..{@code totalSemesters} (typically a four-year, 8-semester program). This
 * module gives admins full CRUD over batches plus a detail view that lays the
 * batch's sections out by semester, with live student head-counts.
 *
 * Kept as a single file (DTO + service + controller) to match
 * {@code AdminSectionModule}'s tighter footprint.
 */
public class AdminBatchModule {

    public record CreateBatchRequest(
            @NotBlank @Size(max = 80) String name,
            @Size(max = 80) String program,
            @Size(max = 80) String department,
            Integer startYear,
            @Min(1) @Max(12) Integer totalSemesters,
            @Size(max = 120) String advisor
    ) {}

    public record UpdateBatchRequest(
            @Size(max = 80) String name,
            @Size(max = 80) String program,
            @Size(max = 80) String department,
            Integer startYear,
            @Min(1) @Max(12) Integer totalSemesters,
            @Size(max = 120) String advisor
    ) {}

    public record BatchDto(
            Long id, String name, String program, String department,
            Integer startYear, Integer totalSemesters, String advisor,
            int sectionsCount, long studentsCount
    ) {
        public static BatchDto from(Batch b, int sectionsCount, long studentsCount) {
            return new BatchDto(
                    b.getId(), b.getName(), b.getProgram(), b.getDepartment(),
                    b.getStartYear(), b.getTotalSemesters(), b.getAdvisor(),
                    sectionsCount, studentsCount);
        }
    }

    /** A section as it appears inside a batch's semester breakdown. */
    public record BatchSectionDto(
            Long id, String sectionName, Integer semester, String department, long studentsCount
    ) {}

    /** All sections of a batch sitting in one semester (1..totalSemesters). */
    public record SemesterGroup(int semester, List<BatchSectionDto> sections) {}

    public record BatchDetailDto(
            Long id, String name, String program, String department,
            Integer startYear, Integer totalSemesters, String advisor,
            int sectionsCount, long studentsCount,
            List<SemesterGroup> semesters
    ) {}

    @Service
    @RequiredArgsConstructor
    public static class AdminBatchService {

        private final BatchRepository batchRepository;
        private final SectionRepository sectionRepository;
        private final StudentRepository studentRepository;

        @Transactional
        public BatchDto create(CreateBatchRequest req) {
            if (batchRepository.existsByNameIgnoreCase(req.name())) {
                throw new ApiException(HttpStatus.CONFLICT, "BATCH_DUPLICATE",
                        "A batch with that name already exists");
            }
            Batch b = batchRepository.save(Batch.builder()
                    .name(req.name())
                    .program(req.program())
                    .department(req.department())
                    .startYear(req.startYear())
                    .totalSemesters(req.totalSemesters() != null ? req.totalSemesters() : 8)
                    .advisor(req.advisor())
                    .build());
            return BatchDto.from(b, 0, 0);
        }

        @Transactional
        public BatchDto update(Long id, UpdateBatchRequest req) {
            Batch b = batchRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Batch", id));
            if (req.name() != null) b.setName(req.name());
            if (req.program() != null) b.setProgram(req.program());
            if (req.department() != null) b.setDepartment(req.department());
            if (req.startYear() != null) b.setStartYear(req.startYear());
            if (req.totalSemesters() != null) b.setTotalSemesters(req.totalSemesters());
            if (req.advisor() != null) b.setAdvisor(req.advisor());
            batchRepository.save(b);
            var sections = sectionRepository.findByBatchIdOrderBySemesterAscSectionNameAsc(id);
            return BatchDto.from(b, sections.size(), countStudents(sections));
        }

        @Transactional(readOnly = true)
        public List<BatchDto> list(String department) {
            var batches = department != null
                    ? batchRepository.findByDepartment(department)
                    : batchRepository.findAll();
            Map<Long, Long> studentCounts = toCountMap(studentRepository.countGroupedBySection());
            return batches.stream().map(b -> {
                var sections = sectionRepository.findByBatchIdOrderBySemesterAscSectionNameAsc(b.getId());
                long students = sections.stream()
                        .mapToLong(s -> studentCounts.getOrDefault(s.getId(), 0L)).sum();
                return BatchDto.from(b, sections.size(), students);
            }).toList();
        }

        @Transactional(readOnly = true)
        public BatchDetailDto detail(Long id) {
            Batch b = batchRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Batch", id));
            var sections = sectionRepository.findByBatchIdOrderBySemesterAscSectionNameAsc(id);
            Map<Long, Long> studentCounts = toCountMap(studentRepository.countGroupedBySection());

            int totalSemesters = b.getTotalSemesters() != null ? b.getTotalSemesters() : 8;

            // Bucket sections by semester. Sections with a null/out-of-range
            // semester land in a trailing "Unassigned" group (semester 0).
            Map<Integer, List<BatchSectionDto>> bySemester = new HashMap<>();
            long totalStudents = 0;
            for (Section s : sections) {
                long count = studentCounts.getOrDefault(s.getId(), 0L);
                totalStudents += count;
                int sem = (s.getSemester() != null && s.getSemester() >= 1 && s.getSemester() <= totalSemesters)
                        ? s.getSemester() : 0;
                bySemester.computeIfAbsent(sem, k -> new ArrayList<>())
                        .add(new BatchSectionDto(s.getId(), s.getSectionName(), s.getSemester(),
                                s.getDepartment(), count));
            }

            List<SemesterGroup> semesters = new ArrayList<>();
            for (int sem = 1; sem <= totalSemesters; sem++) {
                semesters.add(new SemesterGroup(sem, bySemester.getOrDefault(sem, List.of())));
            }
            if (bySemester.containsKey(0)) {
                semesters.add(new SemesterGroup(0, bySemester.get(0)));
            }

            return new BatchDetailDto(
                    b.getId(), b.getName(), b.getProgram(), b.getDepartment(),
                    b.getStartYear(), b.getTotalSemesters(), b.getAdvisor(),
                    sections.size(), totalStudents, semesters);
        }

        @Transactional
        public void delete(Long id) {
            Batch b = batchRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Batch", id));
            // Detach sections rather than cascade-deleting them — the sections
            // (and their students) outlive the cohort grouping.
            for (Section s : sectionRepository.findByBatchIdOrderBySemesterAscSectionNameAsc(id)) {
                s.setBatch(null);
            }
            batchRepository.delete(b);
        }

        /** Attach an existing section to this batch. */
        @Transactional
        public void attachSection(Long batchId, Long sectionId) {
            Batch b = batchRepository.findById(batchId)
                    .orElseThrow(() -> new ResourceNotFoundException("Batch", batchId));
            Section s = sectionRepository.findById(sectionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Section", sectionId));
            s.setBatch(b);
            sectionRepository.save(s);
        }

        /** Remove a section from its batch (the section itself is kept). */
        @Transactional
        public void detachSection(Long batchId, Long sectionId) {
            Section s = sectionRepository.findById(sectionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Section", sectionId));
            if (s.getBatch() == null || !s.getBatch().getId().equals(batchId)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "SECTION_NOT_IN_BATCH",
                        "That section does not belong to this batch");
            }
            s.setBatch(null);
            sectionRepository.save(s);
        }

        private long countStudents(List<Section> sections) {
            Map<Long, Long> studentCounts = toCountMap(studentRepository.countGroupedBySection());
            return sections.stream().mapToLong(s -> studentCounts.getOrDefault(s.getId(), 0L)).sum();
        }

        private static Map<Long, Long> toCountMap(List<Object[]> rows) {
            Map<Long, Long> map = new HashMap<>();
            for (Object[] row : rows) {
                if (row[0] == null) continue;
                map.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
            }
            return map;
        }
    }

    @RestController
    @RequestMapping("/api/admin/batches")
    @RequiredArgsConstructor
    @PreAuthorize("hasRole('ADMIN')")
    @Tag(name = "Admin - Batches")
    public static class AdminBatchController {

        private final AdminBatchService service;

        @PostMapping
        @Operation(summary = "Create batch / cohort")
        public ResponseEntity<ApiResponse<BatchDto>> create(@Valid @RequestBody CreateBatchRequest req) {
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(service.create(req)));
        }

        @GetMapping
        public ApiResponse<List<BatchDto>> list(@RequestParam(required = false) String department) {
            return ApiResponse.ok(service.list(department));
        }

        @GetMapping("/{id}")
        @Operation(summary = "Batch detail with sections grouped by semester")
        public ApiResponse<BatchDetailDto> detail(@PathVariable Long id) {
            return ApiResponse.ok(service.detail(id));
        }

        @PutMapping("/{id}")
        public ApiResponse<BatchDto> update(@PathVariable Long id,
                                            @Valid @RequestBody UpdateBatchRequest req) {
            return ApiResponse.ok(service.update(id, req));
        }

        @DeleteMapping("/{id}")
        public ApiResponse<Void> delete(@PathVariable Long id) {
            service.delete(id);
            return ApiResponse.success("Batch deleted");
        }

        @PostMapping("/{id}/sections/{sectionId}")
        @Operation(summary = "Add an existing section to this batch")
        public ApiResponse<Void> attachSection(@PathVariable Long id, @PathVariable Long sectionId) {
            service.attachSection(id, sectionId);
            return ApiResponse.success("Section added to batch");
        }

        @DeleteMapping("/{id}/sections/{sectionId}")
        @Operation(summary = "Remove a section from this batch")
        public ApiResponse<Void> detachSection(@PathVariable Long id, @PathVariable Long sectionId) {
            service.detachSection(id, sectionId);
            return ApiResponse.success("Section removed from batch");
        }
    }
}
