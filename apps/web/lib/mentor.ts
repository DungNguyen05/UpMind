export interface MentorSubmissionSummary {
  verdict: string
  compileError?: string | null
  failedTestInput?: string | null
  failedTestOutput?: string | null
  aiFeedback?: { content: string; feedbackType?: string | null } | null
}

function firstUsefulLine(text?: string | null) {
  if (!text) return null
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) ?? null
}

export function getMentorNextStep(submission: MentorSubmissionSummary): string {
  const feedbackLead = firstUsefulLine(submission.aiFeedback?.content)
  if (feedbackLead) {
    return feedbackLead.replace(/^[-*#\s]+/, '').slice(0, 110)
  }

  switch (submission.verdict) {
    case 'AC':
      return 'Xem lại độ phức tạp, edge cases và lưu pattern đã dùng.'
    case 'WA':
      return submission.failedTestInput && submission.failedTestInput !== '(hidden)'
        ? 'Trace lại test sai, so expected output với từng bước cập nhật trạng thái.'
        : 'Khoanh vùng invariant và thử tự tạo test nhỏ làm lộ sai khác output.'
    case 'TLE':
      return 'Tìm vòng lặp nóng nhất và giảm độ phức tạp trước khi tối ưu hằng số.'
    case 'MLE':
      return 'Kiểm tra cấu trúc dữ liệu lớn, cấp phát thừa và khả năng nén trạng thái.'
    case 'RE':
      return 'Rà soát truy cập ngoài mảng, chia cho 0, recursion sâu và overflow chỉ số.'
    case 'CE':
      return 'Đọc dòng compile error đầu tiên, sửa khai báo/include trước rồi build lại.'
    case 'pending':
      return 'Đợi judge hoàn tất rồi mở Mentor Review để nhận bước tiếp theo.'
    default:
      return 'Mở Mentor Review để nối verdict với code và test cụ thể.'
  }
}

export function getRootCause(submission: MentorSubmissionSummary): string {
  switch (submission.verdict) {
    case 'AC':
      return 'Code đã qua bộ test hiện tại. Mentor tập trung vào readability, edge cases và cách chứng minh.'
    case 'WA':
      return submission.failedTestInput && submission.failedTestInput !== '(hidden)'
        ? 'Output của chương trình chưa khớp expected output trên một test cụ thể.'
        : 'Có sai khác logic trên hidden test. Cần kiểm tra invariant và các nhánh biên.'
    case 'TLE':
      return 'Thời gian chạy vượt giới hạn, thường do độ phức tạp chưa phù hợp constraints.'
    case 'MLE':
      return 'Bộ nhớ vượt giới hạn, thường do lưu trạng thái hoặc container lớn hơn cần thiết.'
    case 'RE':
      return 'Chương trình dừng bất thường khi chạy, thường do truy cập không hợp lệ hoặc lỗi runtime.'
    case 'CE':
      return firstUsefulLine(submission.compileError) ?? 'Code chưa compile được nên judge chưa chạy test.'
    case 'pending':
      return 'Submission vẫn đang được chấm.'
    default:
      return 'Mentor cần verdict và test để khoanh vùng nguyên nhân rõ hơn.'
  }
}

export function getPatchSuggestion(submission: MentorSubmissionSummary): string {
  switch (submission.verdict) {
    case 'AC':
      return 'Giữ thuật toán hiện tại, thêm comment ngắn cho invariant chính và tự kiểm tra 2-3 edge cases.'
    case 'WA':
      return 'Thêm trace cho biến trạng thái chính trên test nhỏ, sửa nhánh làm sai invariant rồi nộp lại.'
    case 'TLE':
      return 'Viết lại bước chuyển nặng nhất bằng cấu trúc dữ liệu hoặc thuật toán có độ phức tạp thấp hơn.'
    case 'MLE':
      return 'Loại bỏ mảng/bảng không cần thiết, cân nhắc rolling array, nén tọa độ hoặc lưu sparse state.'
    case 'RE':
      return 'Thêm guard cho chỉ số/điều kiện dừng, kiểm tra kích thước container trước khi truy cập.'
    case 'CE':
      return 'Sửa lỗi compile đầu tiên trước, vì các lỗi sau có thể chỉ là hiệu ứng dây chuyền.'
    case 'pending':
      return 'Chờ kết quả judge; sau đó Mentor sẽ ưu tiên lỗi có bằng chứng rõ nhất.'
    default:
      return 'Bắt đầu bằng test nhỏ nhất có thể tái hiện vấn đề, rồi sửa một nguyên nhân tại một thời điểm.'
  }
}

export function getReviewFocus(verdict: string): string {
  switch (verdict) {
    case 'AC':
      return 'Review sau AC'
    case 'WA':
      return 'Sai output'
    case 'TLE':
      return 'Quá thời gian'
    case 'MLE':
      return 'Quá bộ nhớ'
    case 'RE':
      return 'Runtime error'
    case 'CE':
      return 'Compile error'
    case 'pending':
      return 'Đang chấm'
    default:
      return 'Mentor Review'
  }
}
