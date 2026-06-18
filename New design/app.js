(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  function toast(message) {
    let el = $('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 2800);
  }

  function initDropdowns() {
    $$('.dropdown > button, .dropdown > .avatar').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        btn.closest('.dropdown').classList.toggle('open');
      });
    });
    document.addEventListener('click', () => $$('.dropdown.open').forEach(d => d.classList.remove('open')));
  }

  function initTabs() {
    $$('[data-tabs]').forEach(group => {
      const buttons = $$('[data-tab-target]', group);
      const root = group.closest('[data-tab-root]') || document;
      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          const target = btn.dataset.tabTarget;
          buttons.forEach(b => b.classList.toggle('active', b === btn));
          $$('[data-tab-panel]', root).forEach(panel => {
            panel.classList.toggle('active', panel.dataset.tabPanel === target);
          });
        });
      });
    });
  }

  function initPasswordToggles() {
    $$('[data-toggle-password]').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = $(btn.dataset.togglePassword);
        if (!input) return;
        input.type = input.type === 'password' ? 'text' : 'password';
        btn.textContent = input.type === 'password' ? 'Hiện' : 'Ẩn';
      });
    });
  }

  function initAuthForms() {
    const login = $('#loginForm');
    if (login) {
      login.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = $('#loginUser').value.trim();
        const pass = $('#loginPass').value.trim();
        const err = $('#loginError');
        if (!user || pass.length < 4) {
          err.textContent = 'Sai tên đăng nhập hoặc mật khẩu';
          err.classList.remove('hidden');
          login.classList.add('shake');
          return;
        }
        const btn = login.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Đang đăng nhập';
        setTimeout(() => {
          toast('Đăng nhập thành công. Đang chuyển tới danh sách bài tập...');
          btn.innerHTML = 'Đăng nhập';
          btn.disabled = false;
        }, 900);
      });
    }

    const register = $('#registerForm');
    if (register) {
      const username = $('#regUsername');
      const pass = $('#regPass');
      const confirm = $('#regConfirm');
      const strength = $('#strengthBar');
      function validate() {
        const okName = /^[a-zA-Z0-9_]{3,20}$/.test(username.value);
        $('#usernameHelp').textContent = username.value ? (okName ? '✓ Username hợp lệ' : 'Chỉ chữ cái, số, gạch dưới; tối thiểu 3 ký tự') : 'Chỉ chữ cái, số, gạch dưới';
        $('#usernameHelp').className = 'help ' + (username.value ? (okName ? 'ok-text' : 'error-text') : '');
        const score = Math.min(3, (pass.value.length >= 8) + /[A-Z]/.test(pass.value) + /\d/.test(pass.value));
        strength.style.width = (score * 33.33) + '%';
        strength.style.background = score < 2 ? 'var(--danger)' : score < 3 ? 'var(--warn)' : 'var(--accent-2)';
        $('#confirmHelp').textContent = confirm.value && confirm.value !== pass.value ? 'Mật khẩu xác nhận không khớp' : '';
        return okName && score >= 2 && pass.value === confirm.value;
      }
      [username, pass, confirm].forEach(i => i.addEventListener('input', validate));
      register.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!validate()) return toast('Vui lòng kiểm tra lại các trường chưa hợp lệ.');
        const btn = register.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Đang tạo';
        setTimeout(() => {
          btn.disabled = false;
          btn.innerHTML = 'Tạo tài khoản';
          toast('Tạo tài khoản thành công.');
        }, 900);
      });
    }
  }

  function initProblemFilters() {
    const table = $('#problemsTable');
    if (!table) return;
    let difficulty = 'all';
    const activeTags = new Set();
    const search = $('#problemSearch');
    const empty = $('#problemEmpty');
    function apply() {
      const q = (search.value || '').toLowerCase().trim();
      let shown = 0;
      $$('tbody tr', table).forEach(row => {
        const rowTags = (row.dataset.tags || '').split(',');
        const matchText = row.textContent.toLowerCase().includes(q);
        const matchDiff = difficulty === 'all' || row.dataset.difficulty === difficulty;
        const matchTags = !activeTags.size || Array.from(activeTags).every(t => rowTags.includes(t));
        const visible = matchText && matchDiff && matchTags;
        row.classList.toggle('hidden', !visible);
        if (visible) shown++;
      });
      empty.classList.toggle('hidden', shown !== 0);
      $('#shownCount').textContent = shown;
    }
    let timer;
    search.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(apply, 180);
    });
    $$('[data-difficulty-filter]').forEach(btn => btn.addEventListener('click', () => {
      difficulty = btn.dataset.difficultyFilter;
      $$('[data-difficulty-filter]').forEach(b => b.classList.toggle('active', b === btn));
      apply();
    }));
    $$('[data-tag-filter]').forEach(btn => btn.addEventListener('click', () => {
      const t = btn.dataset.tagFilter;
      if (t === 'all') activeTags.clear();
      else activeTags.has(t) ? activeTags.delete(t) : activeTags.add(t);
      $$('[data-tag-filter]').forEach(b => b.classList.toggle('active', b.dataset.tagFilter === 'all' ? !activeTags.size : activeTags.has(b.dataset.tagFilter)));
      apply();
    }));
    $('#clearProblemFilters')?.addEventListener('click', () => {
      search.value = '';
      difficulty = 'all';
      activeTags.clear();
      $$('[data-difficulty-filter]').forEach(b => b.classList.toggle('active', b.dataset.difficultyFilter === 'all'));
      $$('[data-tag-filter]').forEach(b => b.classList.toggle('active', b.dataset.tagFilter === 'all'));
      apply();
    });
    $$('tbody tr[data-href]', table).forEach(row => row.addEventListener('click', e => {
      if (e.target.closest('button,a')) return;
      location.href = row.dataset.href;
    }));
    apply();
  }

  function initSubmissionFilters() {
    const table = $('#submissionsTable');
    if (!table) return;
    const problem = $('#submissionProblemFilter');
    const verdict = $('#submissionVerdictFilter');
    function apply() {
      let count = 0;
      $$('tbody tr', table).forEach(row => {
        const visible = (problem.value === 'all' || row.dataset.problem === problem.value) &&
          (verdict.value === 'all' || row.dataset.verdict === verdict.value);
        row.classList.toggle('hidden', !visible);
        if (visible) count++;
      });
      $('#submissionEmpty').classList.toggle('hidden', count !== 0);
    }
    [problem, verdict].forEach(el => el.addEventListener('change', apply));
    apply();
  }

  function initSolvePage() {
    const submit = $('#submitSolution');
    if (!submit) return;
    const progress = $('#judgeProgress span');
    const status = $('#judgeStatus');
    const verdict = $('#latestVerdict');
    const aiFeedback = $('#feedbackBody');
    submit.addEventListener('click', () => {
      submit.disabled = true;
      submit.innerHTML = '<span class="spinner"></span> Đang chấm';
      verdict.textContent = 'Pending';
      verdict.className = 'badge pending';
      aiFeedback.innerHTML = '<div class="skeleton" style="height:18px;margin-bottom:10px"></div><div class="skeleton" style="height:18px;width:78%"></div>';
      let step = 0;
      const tick = setInterval(() => {
        step += 1;
        progress.style.width = (step * 20) + '%';
        status.textContent = 'Đang chấm test ' + step + '/5...';
        if (step === 5) {
          clearInterval(tick);
          submit.disabled = false;
          submit.innerHTML = 'Nộp bài';
          status.textContent = 'Hoàn thành';
          verdict.textContent = 'WA';
          verdict.className = 'badge wa';
          aiFeedback.innerHTML = '<p><b>WA trên test 4.</b> Ý tưởng dùng hai con trỏ đúng, nhưng đoạn cập nhật <code>right--</code> bỏ qua trường hợp tổng bằng target.</p><p>Hãy kiểm tra lại nhánh so sánh tại dòng 16 và thử in giá trị biên.</p><button class="btn success" id="askMore">Hỏi thêm về feedback này</button>';
          $('#askMore').addEventListener('click', () => {
            $('[data-tab-target="chat"]').click();
            $('#chatText').value = 'Giải thích kỹ hơn lỗi ở dòng 16 giúp em.';
          });
          toast('Judge hoàn tất: Wrong Answer trên test 4.');
        }
      }, 430);
    });

    $$('.gutter').forEach(btn => btn.addEventListener('click', () => {
      $('[data-tab-target="walkthrough"]').click();
      $('#walkLine').textContent = 'Dòng ' + btn.dataset.line;
      $('#walkSnippet').textContent = btn.closest('.code-line').innerText.replace(/^\s*\d+\s*/, '').trim();
      $('#walkExplain').textContent = 'Dòng này đang tham gia vào nhánh xử lý chính. AI sẽ bám theo biến hiện tại và chỉ ra điều kiện biên cần kiểm tra.';
      $('#aiPane').classList.add('open');
    }));
    $('#toggleAi')?.addEventListener('click', () => $('#aiPane').classList.toggle('open'));
    $('#resetCode')?.addEventListener('click', () => $('#resetModal').classList.add('open'));
    $('#cancelReset')?.addEventListener('click', () => $('#resetModal').classList.remove('open'));
    $('#confirmReset')?.addEventListener('click', () => {
      $('#resetModal').classList.remove('open');
      toast('Đã reset code về template C++17.');
    });
    $('#formatCode')?.addEventListener('click', () => toast('Đã format code theo style clang-format.'));
    $$('.hint-card').forEach(btn => btn.addEventListener('click', () => {
      const target = $('#hintReveal');
      if (!target) return;
      target.textContent = btn.dataset.hint || 'Mentor đã mở gợi ý cho bước này.';
      target.classList.remove('subtle');
    }));
    $$('.quick-prompts button').forEach(btn => btn.addEventListener('click', () => {
      const text = $('#chatText');
      if (!text) return;
      text.value = btn.dataset.prompt || btn.textContent.trim();
      text.focus();
    }));
    $('#askMore')?.addEventListener('click', () => {
      $('[data-tab-target="chat"]')?.click();
      const text = $('#chatText');
      if (text) {
        text.value = 'Giải thích kỹ hơn vì sao cần return ngay sau khi tìm thấy đáp án.';
        text.focus();
      }
    });
    $('#sendChat')?.addEventListener('click', () => {
      const text = $('#chatText');
      if (!text.value.trim()) return;
      const list = $('#chatMessages');
      list.insertAdjacentHTML('beforeend', '<div class="message user">' + escapeHtml(text.value.trim()) + '</div>');
      text.value = '';
      const ai = document.createElement('div');
      ai.className = 'message mentor-message';
      ai.textContent = 'Mentor đang đối chiếu đề bài, code hiện tại và submission gần nhất...';
      list.appendChild(ai);
      setTimeout(() => { ai.textContent = 'Mentor: tạo thêm test với đáp án nằm ở hai đầu mảng. Nếu code in đáp án nhưng vẫn chạy tiếp, lỗi control flow sẽ lộ ngay.'; }, 650);
    });
    $$('[data-copy]').forEach(btn => btn.addEventListener('click', () => {
      const target = $(btn.dataset.copy);
      navigator.clipboard?.writeText(target?.innerText || '');
      toast('Đã copy input mẫu.');
    }));
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
  }

  function initAdmin() {
    $$('[data-switch]').forEach(sw => sw.addEventListener('click', () => {
      sw.classList.toggle('on');
      toast(sw.classList.contains('on') ? 'Đã publish bài tập.' : 'Đã chuyển về Draft.');
    }));
    $$('[data-delete]').forEach(btn => btn.addEventListener('click', () => {
      $('#deleteModal').classList.add('open');
      $('#deleteName').textContent = btn.dataset.delete;
    }));
    $('#cancelDelete')?.addEventListener('click', () => $('#deleteModal').classList.remove('open'));
    $('#confirmDelete')?.addEventListener('click', () => {
      $('#deleteModal').classList.remove('open');
      toast('Đã xóa bài trong prototype.');
    });
    $('#saveDraft')?.addEventListener('click', () => toast('Đã lưu nháp.'));
    $('#publishProblem')?.addEventListener('click', () => {
      const name = $('#problemName');
      if (!name?.value.trim()) return toast('Tên bài là bắt buộc.');
      toast('Đã publish bài tập.');
      $('#saveState').textContent = 'Đã lưu';
      $('#saveState').className = 'ok-text mono';
    });
    $('#problemMarkdown')?.addEventListener('input', e => {
      const text = e.target.value.trim() || 'Nội dung đề bài sẽ hiển thị tại đây.';
      $('#previewMarkdown').innerHTML = text
        .replace(/^# (.*)$/gm, '<h2>$1</h2>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
      $('#saveState').textContent = 'Chưa lưu';
      $('#saveState').className = 'error-text mono';
    });
    $('#addCase')?.addEventListener('click', () => {
      $('#caseList').insertAdjacentHTML('beforeend', '<div class="case-row"><textarea placeholder="Input"></textarea><textarea placeholder="Expected output"></textarea><button class="btn icon danger" type="button" data-remove-case>×</button></div>');
    });
    document.addEventListener('click', e => {
      if (e.target.matches('[data-remove-case]')) e.target.closest('.case-row').remove();
    });
    $('#userSearch')?.addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      $$('#usersTable tbody tr').forEach(r => r.classList.toggle('hidden', !r.textContent.toLowerCase().includes(q)));
    });
    $$('[data-role-select]').forEach(sel => sel.addEventListener('change', () => toast('Đã cập nhật role người dùng.')));
  }

  function initStandaloneMentorInteractions() {
    if ($('#submitSolution')) return;
    $$('.quick-prompts button').forEach(btn => btn.addEventListener('click', () => {
      const text = $('#chatText');
      if (!text) return;
      text.value = btn.dataset.prompt || btn.textContent.trim();
      text.focus();
    }));
    $('#sendChat')?.addEventListener('click', () => {
      const text = $('#chatText');
      if (!text.value.trim()) return;
      const list = $('#chatMessages');
      list.insertAdjacentHTML('beforeend', '<div class="message user">' + escapeHtml(text.value.trim()) + '</div>');
      text.value = '';
      const ai = document.createElement('div');
      ai.className = 'message mentor-message';
      ai.textContent = 'Mentor đang đọc lại submission và test tái hiện...';
      list.appendChild(ai);
      setTimeout(() => { ai.textContent = 'Mentor: với lỗi này, ưu tiên sửa control flow trước. Sau khi AC, hãy quay lại hỏi về chứng minh thuật toán để chắc phần tư duy.'; }, 650);
    });
    $$('[data-copy]').forEach(btn => btn.addEventListener('click', () => {
      const target = $(btn.dataset.copy);
      navigator.clipboard?.writeText(target?.innerText || '');
      toast('Đã copy test Mentor đề xuất.');
    }));
  }

  function initErrorPage() {
    $('#goHome')?.addEventListener('click', () => { location.href = 'problems.html'; });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initDropdowns();
    initTabs();
    initPasswordToggles();
    initAuthForms();
    initProblemFilters();
    initSubmissionFilters();
    initSolvePage();
    initStandaloneMentorInteractions();
    initAdmin();
    initErrorPage();
  });
})();
