"use client";

import { useState } from "react";

type Lang = "en" | "vi";

const content: Record<Lang, { title: string; sections: { heading: string; steps: string[] }[] }> = {
  en: {
    title: "How to Use Smart Presenter",
    sections: [
      {
        heading: "1. Create a Presentation",
        steps: [
          'Click "+ New Presentation" on the home page.',
          "Enter a title for your presentation and click Create.",
          "You will be taken to the slide editor.",
        ],
      },
      {
        heading: "2. Add Slides",
        steps: [
          'Use the "Import Lyrics" button to paste song lyrics. Click "Split into Slides" to automatically create slides from the text.',
          "Blank lines in the lyrics separate verses/choruses into individual slides.",
          'You can also click "+ Add Blank Slide" to insert an empty slide manually.',
        ],
      },
      {
        heading: "3. Edit Slides",
        steps: [
          "Click any slide in the sidebar to select it.",
          "Edit the text in the text editor on the right. A live preview shows how the slide will look.",
          "Choose a background from the preset palette or paste a custom image URL.",
          "Drag and drop slides in the sidebar to reorder them.",
          "Select multiple slides (hold Shift or Ctrl/Cmd) to duplicate or delete in bulk.",
        ],
      },
      {
        heading: "4. Save Your Work",
        steps: [
          'Click the "Save" button in the toolbar to save all changes.',
          'An "Unsaved changes" indicator appears when you have pending edits.',
          "The app will warn you before navigating away if you have unsaved changes.",
        ],
      },
      {
        heading: "5. Present",
        steps: [
          'Click "Present" to open the audience fullscreen view in a new tab.',
          'Click "Presenter View" to open the control panel in another tab.',
          "The two views sync automatically -- no server needed.",
          "Use arrow keys, Space, or click to navigate between slides.",
          "Press Escape to exit fullscreen.",
        ],
      },
      {
        heading: "6. Setlists",
        steps: [
          "Create a setlist to group multiple presentations into an ordered sequence.",
          'Click "+ New Setlist" on the home page.',
          "Add presentations to the setlist and drag to reorder.",
          "Present the entire setlist in one continuous session.",
        ],
      },
      {
        heading: "7. Import Songs (AI)",
        steps: [
          'Use "Import Songs" to upload a PDF or paste lyrics.',
          "The AI will parse and split the content into presentations automatically.",
        ],
      },
    ],
  },
  vi: {
    title: "Hướng dẫn sử dụng Smart Presenter",
    sections: [
      {
        heading: "1. Tạo bài trình chiếu",
        steps: [
          'Nhấn "+ New Presentation" trên trang chủ.',
          "Nhập tiêu đề cho bài trình chiếu và nhấn Create.",
          "Bạn sẽ được chuyển đến trang chỉnh sửa slide.",
        ],
      },
      {
        heading: "2. Thêm slide",
        steps: [
          'Nhấn nút "Import Lyrics" để dán lời bài hát. Nhấn "Split into Slides" để tự động tạo slide từ văn bản.',
          "Các dòng trống trong lời bài hát sẽ tách các đoạn/điệp khúc thành các slide riêng biệt.",
          'Bạn cũng có thể nhấn "+ Add Blank Slide" để thêm slide trống thủ công.',
        ],
      },
      {
        heading: "3. Chỉnh sửa slide",
        steps: [
          "Nhấn vào bất kỳ slide nào trong thanh bên để chọn.",
          "Chỉnh sửa văn bản trong trình soạn thảo bên phải. Bản xem trước trực tiếp cho thấy slide sẽ trông như thế nào.",
          "Chọn hình nền từ bảng màu có sẵn hoặc dán URL hình ảnh tùy chỉnh.",
          "Kéo và thả slide trong thanh bên để sắp xếp lại thứ tự.",
          "Chọn nhiều slide (giữ Shift hoặc Ctrl/Cmd) để nhân bản hoặc xóa hàng loạt.",
        ],
      },
      {
        heading: "4. Lưu công việc",
        steps: [
          'Nhấn nút "Save" trên thanh công cụ để lưu tất cả thay đổi.',
          'Chỉ báo "Unsaved changes" sẽ xuất hiện khi bạn có thay đổi chưa lưu.',
          "Ứng dụng sẽ cảnh báo trước khi bạn rời khỏi trang nếu có thay đổi chưa lưu.",
        ],
      },
      {
        heading: "5. Trình chiếu",
        steps: [
          'Nhấn "Present" để mở chế độ toàn màn hình cho khán giả trong tab mới.',
          'Nhấn "Presenter View" để mở bảng điều khiển trong tab khác.',
          "Hai chế độ xem đồng bộ tự động -- không cần server.",
          "Dùng phím mũi tên, Space hoặc nhấn chuột để chuyển slide.",
          "Nhấn Escape để thoát toàn màn hình.",
        ],
      },
      {
        heading: "6. Danh sách bài (Setlist)",
        steps: [
          "Tạo danh sách bài để nhóm nhiều bài trình chiếu thành một chuỗi có thứ tự.",
          'Nhấn "+ New Setlist" trên trang chủ.',
          "Thêm các bài trình chiếu vào danh sách và kéo để sắp xếp lại.",
          "Trình chiếu toàn bộ danh sách trong một phiên liên tục.",
        ],
      },
      {
        heading: "7. Nhập bài hát (AI)",
        steps: [
          'Sử dụng "Import Songs" để tải lên PDF hoặc dán lời bài hát.',
          "AI sẽ phân tích và tách nội dung thành các bài trình chiếu tự động.",
        ],
      },
    ],
  },
};

export function UserGuide() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("en");

  const c = content[lang];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-6 py-2.5 bg-white/10 border border-white/20 text-white rounded-xl font-semibold text-sm hover:bg-white/20 transition-all backdrop-blur-sm"
      >
        ? User Guide
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="bg-gray-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
              <h2 className="text-xl font-bold text-white">{c.title}</h2>
              <div className="flex items-center gap-3">
                <div className="flex rounded-lg overflow-hidden border border-white/20 text-sm">
                  <button
                    onClick={() => setLang("en")}
                    className={`px-3 py-1 font-medium transition-colors ${
                      lang === "en"
                        ? "bg-white text-gray-900"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => setLang("vi")}
                    className={`px-3 py-1 font-medium transition-colors ${
                      lang === "vi"
                        ? "bg-white text-gray-900"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    VI
                  </button>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-white/50 hover:text-white text-2xl leading-none transition-colors"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto px-6 py-5 space-y-6">
              {c.sections.map((section) => (
                <div key={section.heading}>
                  <h3 className="text-base font-semibold text-white mb-2">
                    {section.heading}
                  </h3>
                  <ul className="space-y-1.5">
                    {section.steps.map((step, i) => (
                      <li
                        key={i}
                        className="text-white/70 text-sm leading-relaxed flex gap-2"
                      >
                        <span className="text-white/30 shrink-0">&bull;</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-white/10 shrink-0">
              <button
                onClick={() => setOpen(false)}
                className="w-full py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {lang === "en" ? "Close" : "Đóng"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
