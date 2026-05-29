package com.attendai.modules.announcement;

import com.attendai.common.exception.ApiException;
import com.attendai.common.exception.ResourceNotFoundException;
import com.attendai.common.response.ApiResponse;
import com.attendai.common.response.PageResponse;
import com.attendai.common.util.SecurityUtils;
import com.attendai.config.UserPrincipal;
import com.attendai.domain.announcement.Announcement;
import com.attendai.domain.announcement.AnnouncementRepository;
import com.attendai.domain.user.Role;
import com.attendai.domain.user.User;
import com.attendai.domain.user.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

/**
 * Announcements: posted by admins/teachers, read by everyone (scoped by
 * {@link Announcement.Audience}). Lives under {@code /api/announcements} —
 * outside the role-prefixed paths — so all authenticated users can read it,
 * while writes are guarded with {@code @PreAuthorize}.
 */
public class AnnouncementModule {

    public record AnnouncementDto(
            Long id, String title, String body,
            Announcement.Audience audience, boolean pinned,
            Long authorId, String authorName, Role authorRole,
            Instant createdAt
    ) {
        public static AnnouncementDto from(Announcement a) {
            return new AnnouncementDto(
                    a.getId(), a.getTitle(), a.getBody(),
                    a.getAudience(), a.isPinned(),
                    a.getAuthorId(), a.getAuthorName(), a.getAuthorRole(),
                    a.getCreatedAt());
        }
    }

    public record CreateAnnouncementRequest(
            @NotBlank @Size(max = 160) String title,
            @NotBlank @Size(max = 8000) String body,
            @NotNull Announcement.Audience audience,
            boolean pinned
    ) {}

    @Service
    @RequiredArgsConstructor
    public static class AnnouncementService {

        private final AnnouncementRepository repository;
        private final UserRepository userRepository;

        /** Feed scoped to what the current user's role is allowed to see. */
        @Transactional(readOnly = true)
        public Page<AnnouncementDto> feed(Pageable pageable) {
            UserPrincipal me = SecurityUtils.currentUser();
            Page<Announcement> page = switch (me.getRole()) {
                case ADMIN -> repository.findAllByOrderByPinnedDescCreatedAtDesc(pageable);
                case TEACHER -> repository.findByAudienceInOrderByPinnedDescCreatedAtDesc(
                        List.of(Announcement.Audience.ALL, Announcement.Audience.TEACHERS), pageable);
                case STUDENT -> repository.findByAudienceInOrderByPinnedDescCreatedAtDesc(
                        List.of(Announcement.Audience.ALL, Announcement.Audience.STUDENTS), pageable);
            };
            return page.map(AnnouncementDto::from);
        }

        @Transactional
        public AnnouncementDto create(CreateAnnouncementRequest req) {
            UserPrincipal me = SecurityUtils.currentUser();
            User author = userRepository.findById(me.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", me.getId()));
            Announcement a = Announcement.builder()
                    .title(req.title().trim())
                    .body(req.body().trim())
                    .audience(req.audience())
                    .pinned(req.pinned())
                    .authorId(author.getId())
                    .authorName(author.getFullName())
                    .authorRole(author.getRole())
                    .build();
            return AnnouncementDto.from(repository.save(a));
        }

        @Transactional
        public void delete(Long id) {
            UserPrincipal me = SecurityUtils.currentUser();
            Announcement a = repository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Announcement", id));
            // Admins can remove anything; teachers only their own posts.
            boolean isAdmin = me.getRole() == Role.ADMIN;
            if (!isAdmin && !a.getAuthorId().equals(me.getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "AUTH_005",
                        "You can only delete announcements you posted");
            }
            repository.delete(a);
        }
    }

    @RestController
    @RequestMapping("/api/announcements")
    @RequiredArgsConstructor
    @Tag(name = "Announcements")
    public static class AnnouncementController {

        private final AnnouncementService service;

        @GetMapping
        @Operation(summary = "List announcements visible to the current user")
        public ApiResponse<PageResponse<AnnouncementDto>> list(Pageable pageable) {
            return ApiResponse.ok(PageResponse.from(service.feed(pageable)));
        }

        @PostMapping
        @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
        @Operation(summary = "Post a new announcement (admin/teacher only)")
        public ApiResponse<AnnouncementDto> create(@Valid @RequestBody CreateAnnouncementRequest req) {
            return ApiResponse.ok(service.create(req), "Announcement posted");
        }

        @DeleteMapping("/{id}")
        @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
        @Operation(summary = "Delete an announcement (author or admin)")
        public ApiResponse<Void> delete(@PathVariable Long id) {
            service.delete(id);
            return ApiResponse.success("Announcement deleted");
        }
    }
}
