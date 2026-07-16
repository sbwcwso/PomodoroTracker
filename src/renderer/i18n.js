(function initializeI18n() {
  const english = {
    番茄钟: 'Pomodoro Tracker',
    计时器: 'Timer',
    应用菜单: 'Application menu',
    文件: 'File',
    设置: 'Settings',
    退出: 'Quit',
    编辑: 'Edit',
    撤销: 'Undo',
    重做: 'Redo',
    剪切: 'Cut',
    复制: 'Copy',
    粘贴: 'Paste',
    全选: 'Select all',
    查看: 'View',
    放大: 'Zoom in',
    缩小: 'Zoom out',
    重置缩放: 'Reset zoom',
    重新加载: 'Reload',
    切换全屏: 'Toggle full screen',
    帮助: 'Help',
    关于番茄钟: 'About Pomodoro Tracker',
    主要页面: 'Main pages',
    事项: 'Tasks',
    数据看板: 'Dashboard',
    专注中: 'Focusing',
    休息中: 'On a break',
    已暂停: 'Paused',
    未选择事项: 'No task selected',
    记录当前番茄的想法: 'Add a note to the current pomodoro',
    随手记: 'Quick note',
    打开小窗: 'Open mini timer',
    关闭小窗: 'Close mini timer',
    打断: 'Interrupt',
    分层事项: 'Hierarchical tasks',
    事项分组操作: 'Task group actions',
    事项分组: 'Task groups',
    按顶层分组管理事项: 'Organize tasks by top-level group',
    搜索事项名称: 'Search task names',
    按事项名称搜索: 'Search by task name',
    清空搜索: 'Clear search',
    搜索事项记录: 'Search session notes',
    新建分组: 'New group',
    全部折叠: 'Collapse all',
    进入选择状态: 'Select items',
    删除选中事项或完整分组: 'Delete selected tasks or complete groups',
    日看板: 'Day',
    周看板: 'Week',
    年看板: 'Year',
    选择日期: 'Choose date',
    选择周内日期: 'Choose a date in the week',
    选择年内日期: 'Choose a date in the year',
    显示层级: 'Visible depth',
    '仅顶层（如 CS）': 'Top level only (e.g. CS)',
    '显示到第 2 层（如 CS / AI）': 'Show through level 2 (e.g. CS / AI)',
    '显示到第 3 层': 'Show through level 3',
    显示全部层级: 'Show all levels',
    回到当前时间: 'Back to today',
    当日专注: 'Focus today',
    本周专注: 'Focus this week',
    全年专注: 'Focus this year',
    完整番茄: 'Completed pomodoros',
    被打断次数: 'Interruptions',
    条目时间分布: 'Time by task',
    嵌套圆环表示父子条目的包含关系: 'Nested rings show parent-child relationships',
    今日各条目专注时间占比: 'Share of focus time by task today',
    分钟: 'min',
    小时: 'hr',
    秒: 'sec',
    当日时段分布: 'Time of day',
    本周每日专注: 'Daily focus this week',
    全年月度趋势: 'Monthly focus this year',
    包含完整番茄和被打断的实际时长: 'Includes actual time from completed and interrupted sessions',
    近7天专注时间柱状图: 'Focus time over the last 7 days',
    展开所有子项: 'Expand all descendants',
    折叠所有子项: 'Collapse all descendants',
    删除: 'Delete',
    新建事项: 'New task',
    新建子项: 'New child task',
    新建大项: 'New top-level task',
    名称: 'Name',
    '例如：学习计划': 'For example: Study plan',
    '备注（可选）': 'Notes (optional)',
    补充说明目标或下一步: 'Add context, a goal, or the next step',
    取消: 'Cancel',
    保存: 'Save',
    分组名称: 'Group name',
    '例如：学习与成长': 'For example: Learning and growth',
    创建: 'Create',
    专属计时时长: 'Custom timer duration',
    '专注时长（分钟）': 'Focus duration (minutes)',
    '休息时长（分钟）': 'Break duration (minutes)',
    留空即继承全局默认时长: 'Leave blank to use the global defaults.',
    恢复默认: 'Restore defaults',
    返回搜索结果: 'Back to search results',
    专注历史: 'Focus history',
    事项记录: 'Session note',
    关闭: 'Close',
    搜索当前事项的记录内容: 'Search notes for this task',
    清空历史记录搜索: 'Clear history search',
    使用正则表达式: 'Use regular expression',
    区分大小写: 'Case sensitive',
    时间范围: 'Date range',
    从: 'From',
    至: 'To',
    历史搜索开始日期: 'History search start date',
    历史搜索结束日期: 'History search end date',
    全部时间: 'All time',
    当前事项的记录中没有符合条件的内容: 'No matching notes were found for this task',
    搜索记录内容: 'Search session notes',
    查找番茄结束后填写的事情记录: 'Search notes written after pomodoro sessions',
    输入记录内容或正则表达式: 'Enter note text or a regular expression',
    全局搜索开始日期: 'Global search start date',
    全局搜索结束日期: 'Global search end date',
    '正则示例：项目|阅读　算法.*练习　\\bAPI\\b':
      'Regex examples: project|reading  algorithm.*practice  \\bAPI\\b',
    输入内容后开始搜索: 'Enter text to start searching',
    打断当前番茄: 'Interrupt this pomodoro?',
    '打断当前番茄？': 'Interrupt this pomodoro?',
    '提前结束休息？': 'End the break early?',
    继续计时: 'Keep timing',
    确认打断: 'Interrupt',
    删除所选内容: 'Delete selected content',
    '确认删除？': 'Confirm deletion?',
    删除后无法恢复请确认选择无误: 'This cannot be undone. Please check your selection.',
    保留这些内容: 'Keep content',
    确认删除: 'Delete',
    番茄小结: 'Pomodoro summary',
    '这个番茄完成了什么？': 'What did you accomplish?',
    日期: 'Date',
    计时时间: 'Session time',
    实际时长: 'Actual duration',
    事情记录: 'Session note',
    'Markdown 语法帮助': 'Markdown help',
    查看Markdown语法帮助: 'View Markdown help',
    简明Markdown: 'Basic Markdown',
    '## 标题': '## Heading',
    '**重点**': '**important**',
    '*补充*': '*aside*',
    '~~废弃~~': '~~obsolete~~',
    '- 清单项': '- list item',
    '1. 步骤': '1. step',
    '> 摘要': '> summary',
    '`代码`': '`code`',
    '[名称](https://...)': '[label](https://...)',
    标题: 'Heading',
    粗体: 'Bold',
    斜体: 'Italic',
    删除线: 'Strikethrough',
    无序列表: 'Bulleted list',
    有序列表: 'Numbered list',
    引用: 'Quote',
    行内代码: 'Inline code',
    链接: 'Link',
    暂不填写: 'Skip for now',
    '例如：整理了第三章笔记，完成了两道练习题……':
      'For example: Organized chapter 3 notes and completed two exercises…',
    保存记录: 'Save note',
    设置类别: 'Settings categories',
    按类别调整番茄钟的行为与数据选项: 'Adjust timer behavior and data options by category',
    常规: 'General',
    声音: 'Sound',
    数据: 'Data',
    界面与显示: 'Interface and display',
    调整软件的语言和整体显示比例: 'Choose the app language and overall display scale.',
    界面语言: 'Interface language',
    '英文（默认）': 'English (default)',
    简体中文: 'Simplified Chinese',
    界面缩放: 'Interface scale',
    '快捷键：Ctrl + + 放大，Ctrl + - 缩小，Ctrl + 0 重置。':
      'Shortcuts: Ctrl + + to zoom in, Ctrl + - to zoom out, Ctrl + 0 to reset.',
    番茄钟行为: 'Timer behavior',
    设置默认时长以及计时小窗的显示方式: 'Set default durations and mini timer behavior.',
    计时小窗置顶: 'Keep mini timer on top',
    弹出的计时窗口保持在其它窗口上方: 'Keep the mini timer above other windows.',
    组合专注时的自然声并选择计时结束提示音: 'Mix nature sounds and choose completion sounds.',
    专注自然声: 'Focus nature sounds',
    仅在专注计时期间循环播放休息和结束时自动淡出:
      'Loops only while focusing and fades out during breaks or when finished',
    启用: 'Enabled',
    总音量: 'Master volume',
    大雨: 'Heavy rain',
    森林雨: 'Forest rain',
    溪流: 'Stream',
    雷雨: 'Thunderstorm',
    风声: 'Wind',
    壁炉: 'Fireplace',
    可以同时开启多种声音组合出自己的环境声: 'Combine multiple sounds to create your own ambience.',
    专注结束提示音: 'Focus completion sound',
    休息结束提示音: 'Break completion sound',
    选择: 'Choose…',
    '选择...': 'Choose…',
    默认: 'Default',
    默认提示音: 'Default sound',
    数据与统计: 'Data and statistics',
    设置看板中的每周划分方式以及本地数据库位置:
      'Configure week boundaries and local database storage.',
    每周开始于: 'Week starts on',
    '星期一（默认）': 'Monday (default)',
    星期二: 'Tuesday',
    星期三: 'Wednesday',
    星期四: 'Thursday',
    星期五: 'Friday',
    星期六: 'Saturday',
    星期日: 'Sunday',
    数据库文件: 'Database file',
    选择已有文件: 'Choose existing file…',
    '选择已有文件...': 'Choose existing file…',
    数据库包含事项结构专注历史和事项记录更换前请确认目标文件无误:
      'The database contains tasks, focus history, and notes. Verify the target file before switching.',
    完成: 'Done',
    支持分级事项和本地记录的专注工具:
      'A private focus tracker with hierarchical tasks and local records.',
    确定: 'OK',
    未填写: 'Not entered',
    日期未知: 'Unknown date',
    未知日期: 'Unknown date',
    向上移动: 'Move up',
    向下移动: 'Move down',
    已经到顶: 'Already first',
    已经到底: 'Already last',
    自身: 'self',
    按顶层事项汇总所有后代条目的专注时间:
      'Focus time for every descendant is included in its top-level task',
    所选时间没有专注记录: 'No focus sessions in the selected period',
    每4小时汇总包含被打断时已完成的时间:
      'Grouped in 4-hour intervals, including elapsed time from interruptions',
    按设置的每周起始日展示7天: 'Shows 7 days using the configured first day of the week',
    按月汇总全年实际专注时间: 'Actual focus time grouped by month',
    恢复为未完成: 'Mark as incomplete',
    标记完成: 'Mark complete',
    查看专注记录: 'View focus history',
    设置番茄钟时长: 'Customize timer',
    新建子条目: 'Add child task',
    展开子项: 'Expand children',
    折叠子项: 'Collapse children',
    个番茄: 'pomodoros',
    默认分组: 'Default group',
    当前默认分组: 'Current default group',
    设为默认分组: 'Make default group',
    重命名分组: 'Rename group',
    在此分组中新建事项: 'Add task to this group',
    暂无事项可拖动到这里: 'No tasks yet. Drag tasks here.',
    没有找到符合条件的事项: 'No matching tasks found',
    保存名称: 'Save name',
    重命名事项: 'Rename task',
    该事项还没有专注记录: 'This task has no focus history yet',
    被打断: 'Interrupted',
    修改: 'Edit',
    专注时间: 'Focus time',
    开始日期不能晚于结束日期: 'The start date cannot be after the end date',
    搜索中: 'Searching…',
    输入内容或选择时间范围后开始搜索: 'Enter text or choose a date range to search',
    没有找到符合条件的记录: 'No matching notes found',
    请修改搜索条件后重试: 'Adjust the search options and try again',
    番茄完成: 'Pomodoro complete',
    这段专注已经记录开始休息: 'Your focus session was saved. Time for a break.',
    休息结束: 'Break complete',
    休息时间结束可以开始下一个番茄: 'The break is over. You can start another pomodoro.',
    知道了: 'Got it',
    本次未记录: 'Session not saved',
    计时已结束: 'Timer stopped',
    为避免误触产生无效数据本次计时不会写入数据库:
      'To avoid accidental records, this session was not written to the database.',
    名称冲突: 'Name conflict',
    这个名称已经被使用: 'This name is already in use',
    当前事项已锁定: 'Current task is locked',
    番茄进行中不能切换事项: 'You cannot switch tasks while a pomodoro is running',
    完成或打断当前番茄后才可以操作其他事项:
      'Complete or interrupt the current pomodoro before using another task.',
    修改记录: 'Edit note',
    修改事项记录: 'Edit session note',
    保持当前记录: 'Keep current note',
    专注随手记: 'Focus quick note',
    保存草稿: 'Save draft',
    收起语法帮助: 'Hide Markdown help',
    名称不能为空: 'Name required',
    请输入分组名称: 'Enter a group name',
    分组名称不能只包含空格: 'A group name cannot contain only spaces.',
    输入一个便于识别的名称后再保存: 'Enter a recognizable name before saving.',
    请输入事项名称: 'Enter a task name',
    事项名称不能只包含空格: 'A task name cannot contain only spaces.',
    无法移动事项: 'Unable to move task',
    不能移动到自身的层级中: 'A task cannot be moved inside itself',
    目标位置是当前事项本身或者位于它的子事项中:
      'The destination is the current task or one of its descendants.',
    请选择其它事项作为新的父事项或者拖到大分组空白处成为一级事项:
      'Choose another parent, or drag it to an empty group area to make it top-level.',
    删除这个事项: 'Delete this task?',
    事项名称不能为空: 'Task name is required',
    顶层分组不能拥有父事项: 'A top-level group cannot have a parent task',
    同一个父事项下不能存在同名子事项: 'Sibling tasks must have unique names',
    事项不存在: 'Task not found',
    分组不存在: 'Group not found',
    目标分组不存在: 'Destination group not found',
    目标父事项不存在: 'Destination parent task not found',
    只能移动普通事项: 'Only regular tasks can be moved',
    不能将事项移动到自身或其子事项中: 'A task cannot be moved into itself or a descendant',
    移动方向无效: 'Invalid move direction',
    计时时长必须是1到1440之间的整数分钟:
      'Timer duration must be a whole number from 1 to 1440 minutes',
    顶层分组不能直接计时: 'Top-level groups cannot be timed directly',
    专注记录不存在: 'Focus record not found',
  };

  const textMetadata = new WeakMap();
  const attributeMetadata = new WeakMap();
  let locale = 'en-US';

  function compact(value) {
    return String(value).replace(/[\s，。？：；]/g, '');
  }

  const compactEnglish = new Map(
    Object.entries(english).map(([source, translation]) => [compact(source), translation]),
  );

  function translateDynamic(source) {
    const exact = english[source] || compactEnglish.get(compact(source));
    if (exact) {
      return exact;
    }
    const replacements = [
      [/^(\d+) 秒$/, '$1 sec'],
      [/^(\d+) 分钟$/, '$1 min'],
      [/^(\d+) 小时$/, '$1 hr'],
      [/^(\d+) 小时 (\d+) 分钟$/, '$1 hr $2 min'],
      [/^(\d+) 小时 (\d+) 分$/, '$1 hr $2 min'],
      [/^(\d+) 分 (\d+) 秒$/, '$1 min $2 sec'],
      [/^(\d+(?:\.\d+)?) 小时$/, '$1 hr'],
      [/^(\d+) 个匹配$/, '$1 matches'],
      [/^(\d+) 条结果$/, '$1 results'],
      [/^(\d+) 条记录 · (.+)$/, '$1 records · $2'],
      [/^(\d+) 个番茄 · (.+)$/, '$1 pomodoros · $2'],
      [/^(\d+) 月$/, 'Month $1'],
      [/^(\d{4}) 年$/, '$1'],
      [/^至 (.+)$/, 'to $1'],
      [/^(.*) 至 (.*)$/, '$1 to $2'],
      [/^专注 (\d+) 分钟，休息 (\d+) 分钟$/, 'Focus $1 min, break $2 min'],
      [/^正则表达式无效：(.*)$/, 'Invalid regular expression: $1'],
      [
        /^启动番茄钟 · 专注 (\d+) 分钟，休息 (\d+) 分钟$/,
        'Start pomodoro · Focus $1 min, break $2 min',
      ],
      [
        /^在 (.+) 上启动番茄钟，专注 (\d+) 分钟，休息 (\d+) 分钟$/,
        'Start a pomodoro for $1: focus $2 min, break $3 min',
      ],
      [/^将 (.+) 恢复为未完成$/, 'Mark $1 as incomplete'],
      [/^将 (.+) 标记完成$/, 'Mark $1 as complete'],
      [/^查看 (.+) 的专注记录$/, 'View focus history for $1'],
      [/^设置 (.+) 的番茄钟时长$/, 'Customize timer for $1'],
      [/^重命名 (.+)$/, 'Rename $1'],
      [/^在 (.+) 下新建子条目$/, 'Add a child task under $1'],
      [/^选择 (.+)$/, 'Select $1'],
      [/^选择 (.+) 中的全部事项$/, 'Select every task in $1'],
      [/^(.+) 是当前默认分组$/, '$1 is the current default group'],
      [/^将 (.+) 设为默认分组$/, 'Make $1 the default group'],
      [/^在 (.+) 中新建事项$/, 'Add a task to $1'],
      [/^当前正在专注“(.+)”。$/, 'Currently focusing on “$1”.'],
      [
        /^本次专注时长为 (.+)，不足 30 秒。$/,
        'This focus session lasted $1, less than 30 seconds.',
      ],
      [
        /^(.+) · 草稿将在本次专注结束时自动写入记录$/,
        '$1 · The draft will be saved when this focus session ends',
      ],
      [/^删除“(.+)”$/, 'Delete “$1”?'],
      [
        /^将删除事项“(.+)”、它的所有子项以及相关专注记录。$/,
        'This will delete “$1”, all descendants, and their focus records.',
      ],
      [/^(\d+) 个事项及其所有子项和记录$/, '$1 tasks, their descendants, and records'],
      [/^(\d+) 个完整分组$/, '$1 complete groups'],
      [/^目标位置中已存在“(.+)”$/, '“$1” already exists at the destination'],
    ];
    for (const [pattern, replacement] of replacements) {
      if (pattern.test(source)) {
        return source.replace(pattern, replacement);
      }
    }
    return source;
  }

  function t(source) {
    return locale === 'zh-CN' ? String(source) : translateDynamic(String(source));
  }

  function translateTextNode(node) {
    if (
      node.parentElement?.closest(
        'script, style, .markdown-content, .record-search-result__path, ' +
          '.history-entry__times small, .root-select > span:first-child, ' +
          '.task-group__toggle > span:nth-child(2), #active-timer-title, ' +
          '#task-history-title, #task-timer-name, #session-note-task, #task-title, ' +
          '.dashboard-legend__label',
      )
    ) {
      return;
    }
    const current = node.nodeValue;
    let metadata = textMetadata.get(node);
    if (!metadata || (current !== metadata.rendered && current !== metadata.source)) {
      metadata = { source: current, rendered: current };
      textMetadata.set(node, metadata);
    }
    const leading = metadata.source.match(/^\s*/u)?.[0] || '';
    const trailing = metadata.source.match(/\s*$/u)?.[0] || '';
    const source = metadata.source.trim();
    const rendered = source ? `${leading}${t(source)}${trailing}` : metadata.source;
    metadata.rendered = rendered;
    if (current !== rendered) {
      node.nodeValue = rendered;
    }
  }

  function translateAttribute(element, name) {
    if (!element.hasAttribute(name)) {
      return;
    }
    let metadata = attributeMetadata.get(element);
    if (!metadata) {
      metadata = new Map();
      attributeMetadata.set(element, metadata);
    }
    const current = element.getAttribute(name);
    const previous = metadata.get(name);
    if (!previous || (current !== previous.rendered && current !== previous.source)) {
      metadata.set(name, { source: current, rendered: current });
    }
    const value = metadata.get(name);
    if (name === 'title') {
      element.dataset.i18nTitleSource = value.source;
    }
    const rendered = t(value.source);
    value.rendered = rendered;
    if (current !== rendered) {
      element.setAttribute(name, rendered);
    }
  }

  function translateElement(element) {
    ['title', 'placeholder', 'aria-label', 'data-tooltip'].forEach((name) =>
      translateAttribute(element, name),
    );
  }

  function translateTree(root = document) {
    if (root.nodeType === window.Node.TEXT_NODE) {
      translateTextNode(root);
      return;
    }
    if (root.nodeType !== window.Node.DOCUMENT_NODE && root.nodeType !== window.Node.ELEMENT_NODE) {
      return;
    }
    if (root.nodeType === window.Node.ELEMENT_NODE) {
      translateElement(root);
    }
    const walker = document.createTreeWalker(
      root,
      window.NodeFilter.SHOW_ELEMENT | window.NodeFilter.SHOW_TEXT,
    );
    let node = walker.nextNode();
    while (node) {
      if (node.nodeType === window.Node.TEXT_NODE) {
        translateTextNode(node);
      } else {
        translateElement(node);
      }
      node = walker.nextNode();
    }
    document.documentElement.lang = locale === 'zh-CN' ? 'zh-CN' : 'en';
  }

  function setLocale(value) {
    locale = value === 'zh-CN' ? 'zh-CN' : 'en-US';
    translateTree();
    window.dispatchEvent(new window.CustomEvent('app-language-changed', { detail: { locale } }));
  }

  window.i18n = { getLocale: () => locale, setLocale, t, translateTree };
  translateTree();
  new window.MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'characterData') {
        translateTextNode(mutation.target);
      } else if (mutation.type === 'attributes') {
        translateAttribute(mutation.target, mutation.attributeName);
      } else {
        mutation.addedNodes.forEach((node) => translateTree(node));
      }
    });
  }).observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['title', 'placeholder', 'aria-label', 'data-tooltip'],
  });
})();
