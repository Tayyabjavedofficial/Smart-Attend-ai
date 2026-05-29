package com.attendai.modules.admin;

import com.attendai.common.exception.ResourceNotFoundException;
import com.attendai.common.response.ApiResponse;
import com.attendai.domain.course.Batch;
import com.attendai.domain.course.BatchRepository;
import com.attendai.domain.course.Section;
import com.attendai.domain.course.SectionRepository;
import com.attendai.domain.course.TeacherCourse;
import com.attendai.domain.course.TeacherCourseRepository;
import com.attendai.domain.user.Student;
import com.attendai.domain.user.StudentRepository;
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Sections are simple enough to keep all three layers (DTO, service, controller)
 * in one file. Other modules follow the same split-file pattern; this is just
 * a tighter footprint where the surface area doesn't justify the spread.
 *
 * Beyond plain CRUD, the list view enriches each section with a live
 * student head-count and subject count (computed in two grouped queries, not
 * per-row), and a detail endpoint returns the full roster plus the subjects
 * taught in the section together with their teachers.
 */
public class AdminSectionModule {

    public record CreateSectionRequest(
            @NotBlank @Size(max = 50) String sectionName,
            Integer semester,
            @Size(max = 80) String department,
            Long batchId
    ) {}

    public record UpdateSectionRequest(
            @Size(max = 50) String sectionName,
            Integer semester,
            @Size(max = 80) String department,
            // Present + null clears the batch; absent leaves it unchanged is not
            // distinguishable for a primitive, so callers always send the desired
            // batch (or null to detach).
            Long batchId
    ) {}

    public record SectionDto(
            Long id, String sectionName, Integer semester, String department,
            Long batchId, String batchName,
            long studentsCount, long subjectsCount
    ) {
        public static SectionDto from(Section s, long studentsCount, long subjectsCount) {
            Batch b = s.getBatch();
            return new SectionDto(
                    s.getId(), s.getSectionName(), s.getSemester(), s.getDepartment(),
                    b != null ? b.getId() : null,
                    b != null ? b.getName() : null,
                    studentsCount, subjectsCount);
        }
    }

    /** A student on a section roster. */
    public record SectionStudent(
            Long id, String fullName, String registrationNumber, String email, String status
    ) {
        public static SectionStudent from(Student s) {
            return new SectionStudent(
                    s.getId(),
                    s.getUser().getFullName(),
                    s.getRegistrationNumber(),
                    s.getUser().getEmail(),
                    s.getUser().getStatus() != null ? s.getUser().getStatus().name() : null);
        }
    }

    /** A subject offered in a section, paired with the teacher who teaches it. */
    public record SectionSubject(
            Long assignmentId, Long courseId, String courseCode, String courseName,
            Integer creditHours, Long teacherId, String teacherName
    ) {
        public static SectionSubject from(TeacherCourse tc) {
            return new SectionSubject(
                    tc.getId(),
                    tc.getCourse().getId(),
                    tc.getCourse().getCourseCode(),
                    tc.getCourse().getCourseName(),
                    tc.getCourse().getCreditHours(),
                    tc.getTeacher().getId(),
                    tc.getTeacher().getUser().getFullName());
        }
    }

    public record SectionDetailDto(
            Long id, String sectionName, Integer semester, String department,
            Long batchId, String batchName,
            int studentsCount, int subjectsCount,
            List<SectionStudent> students,
            List<SectionSubject> subjects
    ) {}

    @Service
    @RequiredArgsConstructor
    public static class AdminSectionService {

        private final SectionRepository sectionRepository;
        private final StudentRepository studentRepository;
        private final TeacherCourseRepository teacherCourseRepository;
        private final BatchRepository batchRepository;

        @Transactional
        public SectionDto create(CreateSectionRequest req) {
            Section s = sectionRepository.save(Section.builder()
                    .sectionName(req.sectionName())
                    .semester(req.semester())
                    .department(req.department())
                    .batch(resolveBatch(req.batchId()))
                    .build());
            // A freshly-created section has no students or subjects yet.
            return SectionDto.from(s, 0, 0);
        }

        @Transactional
        public SectionDto update(Long id, UpdateSectionRequest req) {
            Section s = sectionRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Section", id));
            if (req.sectionName() != null) s.setSectionName(req.sectionName());
            if (req.semester() != null) s.setSemester(req.semester());
            if (req.department() != null) s.setDepartment(req.department());
            s.setBatch(resolveBatch(req.batchId()));
            sectionRepository.save(s);
            return SectionDto.from(s,
                    studentRepository.countBySectionId(id),
                    teacherCourseRepository.findBySectionId(id).stream()
                            .map(tc -> tc.getCourse().getId()).distinct().count());
        }

        @Transactional(readOnly = true)
        public List<SectionDto> list(String department) {
            var list = department != null
                    ? sectionRepository.findByDepartment(department)
                    : sectionRepository.findAll();

            Map<Long, Long> studentCounts = toCountMap(studentRepository.countGroupedBySection());
            Map<Long, Long> courseCounts = toCountMap(teacherCourseRepository.countCoursesGroupedBySection());

            return list.stream()
                    .map(s -> SectionDto.from(s,
                            studentCounts.getOrDefault(s.getId(), 0L),
                            courseCounts.getOrDefault(s.getId(), 0L)))
                    .toList();
        }

        @Transactional(readOnly = true)
        public SectionDetailDto detail(Long id) {
            Section s = sectionRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Section", id));

            List<SectionStudent> students = studentRepository.findBySectionId(id).stream()
                    .map(SectionStudent::from)
                    .sorted((a, b) -> a.fullName().compareToIgnoreCase(b.fullName()))
                    .toList();

            List<SectionSubject> subjects = teacherCourseRepository.findBySectionId(id).stream()
                    .map(SectionSubject::from)
                    .sorted((a, b) -> a.courseCode().compareToIgnoreCase(b.courseCode()))
                    .toList();

            Batch b = s.getBatch();
            int distinctSubjects = (int) subjects.stream().map(SectionSubject::courseId).distinct().count();

            return new SectionDetailDto(
                    s.getId(), s.getSectionName(), s.getSemester(), s.getDepartment(),
                    b != null ? b.getId() : null,
                    b != null ? b.getName() : null,
                    students.size(), distinctSubjects,
                    students, subjects);
        }

        @Transactional
        public void delete(Long id) {
            if (!sectionRepository.existsById(id)) {
                throw new ResourceNotFoundException("Section", id);
            }
            sectionRepository.deleteById(id);
        }

        private Batch resolveBatch(Long batchId) {
            if (batchId == null) return null;
            return batchRepository.findById(batchId)
                    .orElseThrow(() -> new ResourceNotFoundException("Batch", batchId));
        }

        /** Turn grouped {@code [id, count]} rows into an id→count map. */
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
            // The single-section view reuses detail() then projects to the slim DTO
            // so the count fields stay populated.
            var d = service.detail(id);
            return ApiResponse.ok(new SectionDto(
                    d.id(), d.sectionName(), d.semester(), d.department(),
                    d.batchId(), d.batchName(), d.studentsCount(), d.subjectsCount()));
        }

        @GetMapping("/{id}/detail")
        @Operation(summary = "Section roster + subjects taught")
        public ApiResponse<SectionDetailDto> detail(@PathVariable Long id) {
            return ApiResponse.ok(service.detail(id));
        }

        @PutMapping("/{id}")
        @Operation(summary = "Update section (rename / move department / assign batch)")
        public ApiResponse<SectionDto> update(@PathVariable Long id,
                                              @Valid @RequestBody UpdateSectionRequest req) {
            return ApiResponse.ok(service.update(id, req));
        }

        @DeleteMapping("/{id}")
        public ApiResponse<Void> delete(@PathVariable Long id) {
            service.delete(id);
            return ApiResponse.success("Section deleted");
        }
    }
}
