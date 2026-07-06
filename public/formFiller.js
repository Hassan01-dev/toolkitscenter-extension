// Content script for Toolkitscenter Fake Data Filler tool

if (!window.hasFormFillerScriptInjected) {
  window.hasFormFillerScriptInjected = true;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'fill_forms') {
      try {
        sendResponse(fillFormsOnPage(message.options || {}));
      } catch (err) {
        console.error('Error in fillFormsOnPage:', err);
        sendResponse({ error: err.message || String(err) });
      }
      return false; // synchronous response
    }
  });

  const FDF_FIRST_NAMES = [
    'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
    'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
    'Thomas', 'Sarah', 'Charles', 'Karen', 'Daniel', 'Nancy', 'Matthew', 'Lisa',
    'Anthony', 'Betty', 'Priya', 'Wei', 'Fatima', 'Carlos'
  ];
  const FDF_LAST_NAMES = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
    'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
    'White', 'Harris', 'Clark', 'Ramirez', 'Lewis', 'Walker', 'Young'
  ];
  const FDF_STREETS = [
    'Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Elm St', 'Washington Ave',
    'Park Rd', 'Sunset Blvd', 'Lakeview Dr', 'Highland Ave'
  ];
  const FDF_CITIES = [
    'Springfield', 'Riverside', 'Franklin', 'Greenville', 'Fairview', 'Salem',
    'Georgetown', 'Madison', 'Arlington', 'Clinton'
  ];
  const FDF_STATES = [
    ['Alabama', 'AL'], ['Alaska', 'AK'], ['Arizona', 'AZ'], ['California', 'CA'],
    ['Colorado', 'CO'], ['Florida', 'FL'], ['Georgia', 'GA'], ['Illinois', 'IL'],
    ['New York', 'NY'], ['Ohio', 'OH'], ['Texas', 'TX'], ['Washington', 'WA']
  ];
  const FDF_COMPANIES = [
    'Acme Corp', 'Globex Inc', 'Initech', 'Umbrella Co', 'Stark Industries',
    'Wayne Enterprises', 'Hooli', 'Wonka Industries', 'Soylent Corp', 'Cyberdyne Systems'
  ];
  const FDF_DOMAINS = ['example.com', 'test.com', 'mail.com', 'sample.org'];
  const FDF_WORDS = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
    'sample', 'demo', 'test', 'preview', 'quick', 'brown', 'fox', 'jumps', 'over',
    'lazy', 'dog', 'hello', 'world', 'placeholder', 'content', 'value', 'data'
  ];

  // Ordered (most specific first) semantic field-detection rules.
  const FDF_FIELD_RULES = [
    { type: 'email', test: /e[-_]?mail/ },
    { type: 'confirmPassword', test: /(confirm|repeat|re[-_]?enter|verify)[a-z_-]{0,15}pass|pass[a-z_-]{0,15}(confirm|repeat|match)/ },
    { type: 'password', test: /pass(word)?|pwd/ },
    { type: 'username', test: /user([-_]?name)?|login|handle/ },
    { type: 'firstName', test: /first[-_]?name|fname|given[-_]?name/ },
    { type: 'lastName', test: /last[-_]?name|lname|surname|family[-_]?name/ },
    // Checked BEFORE the bare "name" fallback below — "Institution Name" /
    // "Company Name" / "School Name" fields contain the word "name" but must
    // generate an organization name, not a person's first+last name.
    { type: 'company', test: /compan(y|ies)|organi[sz]ation|employer|institution|\bschool\b|business/ },
    { type: 'fullName', test: /(^|[^a-z])name([^a-z]|$)|full[-_]?name|your[-_]?name|display[-_]?name/ },
    { type: 'ccNumber', test: /card[-_]?number|cc[-_]?num|credit[-_]?card/ },
    { type: 'cvv', test: /\bcvv\b|\bcvc\b|\bcsc\b|security[-_]?code/ },
    { type: 'ccExpiry', test: /cc[-_]?exp|exp(iry|iration)|exp[-_]?date/ },
    // "tel" is bounded so it doesn't match inside unrelated words like
    // "Tell us about your needs", "hotel", or "intel" — phone/mobile/cell
    // stay unbounded since they're needed to catch concatenated camelCase
    // field names (e.g. "phoneNumber" -> "phonenumber" after lowercasing).
    { type: 'phone', test: /phone|mobile|(?<![a-z])tel(?:ephone)?(?![a-z])|cell/ },
    { type: 'zip', test: /zip|postal/ },
    { type: 'state', test: /\bstate\b|province|region|address-level1/ },
    { type: 'city', test: /\bcity\b|\btown\b|address-level2/ },
    { type: 'country', test: /country|nation/ },
    { type: 'address2', test: /address[-_]?(2|line ?2)|\bapt\b|\bsuite\b|\bunit\b/ },
    { type: 'address', test: /address|street/ },
    { type: 'url', test: /\burl\b|website|\bsite\b|\blink\b/ },
    { type: 'birthdate', test: /birth|\bdob\b|\bborn\b|\bbday\b/ },
    { type: 'age', test: /\bage\b/ },
    { type: 'otp', test: /\botp\b|verification[-_]?code|auth[-_]?code|\bcode\b/ },
    { type: 'message', test: /message|comment|\bbio\b|about|description|feedback/ },
    { type: 'search', test: /search|query|^q$/ }
  ];

  function fdfRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function fdfRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function fdfRandomDigits(n) {
    let s = '';
    for (let i = 0; i < n; i++) s += fdfRandomInt(0, 9);
    return s;
  }

  function fdfIsVisible(el) {
    if (!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)) return false;
    const view = el.ownerDocument.defaultView || window;
    const style = view.getComputedStyle(el);
    return style.visibility !== 'hidden' && style.display !== 'none';
  }

  function fdfGetLabelText(el) {
    let text = '';
    if (el.labels && el.labels.length) {
      text = Array.from(el.labels).map(l => l.textContent).join(' ');
    }
    if (!text && el.id) {
      try {
        const lbl = el.ownerDocument.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (lbl) text = lbl.textContent;
      } catch (e) {
        // Invalid id for selector, ignore
      }
    }
    if (!text) {
      text = el.getAttribute('aria-label') || '';
    }
    if (!text) {
      const describedBy = el.getAttribute('aria-labelledby');
      if (describedBy) {
        text = describedBy
          .split(/\s+/)
          .map(id => {
            const n = el.ownerDocument.getElementById(id);
            return n ? n.textContent : '';
          })
          .join(' ');
      }
    }
    return text || '';
  }

  function fdfBuildSignature(el) {
    return [
      el.name,
      el.id,
      el.placeholder,
      el.getAttribute('autocomplete'),
      fdfGetLabelText(el)
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  function fdfDetectFieldType(el, signature) {
    for (const rule of FDF_FIELD_RULES) {
      if (rule.test.test(signature)) return rule.type;
    }
    const nativeType = (el.type || '').toLowerCase();
    if (nativeType === 'email') return 'email';
    if (nativeType === 'tel') return 'phone';
    if (nativeType === 'url') return 'url';
    if (nativeType === 'password') return 'password';
    if (el.tagName === 'TEXTAREA') return 'message';
    return 'generic';
  }

  function fdfGetConstraints(el) {
    return {
      required: !!el.required,
      minLength: typeof el.minLength === 'number' && el.minLength > 0 ? el.minLength : null,
      maxLength: typeof el.maxLength === 'number' && el.maxLength > 0 ? el.maxLength : null,
      min: el.min !== undefined && el.min !== '' ? el.min : null,
      max: el.max !== undefined && el.max !== '' ? el.max : null,
      pattern: el.pattern || null,
      step: el.step && el.step !== 'any' ? el.step : null
    };
  }

  // Best-effort constraint fitting. Arbitrary custom `pattern` regexes can't be
  // reliably satisfied without a regex-to-string generator, so we only handle
  // the common "digits only" mismatch and length trimming/padding.
  function fdfFitConstraints(value, c) {
    let v = String(value);
    if (c.pattern) {
      try {
        const re = new RegExp('^(?:' + c.pattern + ')$');
        if (!re.test(v)) {
          const digitsOnly = v.replace(/\D/g, '');
          if (digitsOnly && re.test(digitsOnly)) v = digitsOnly;
        }
      } catch (e) {
        // Invalid/unsupported pattern syntax, ignore
      }
    }
    if (c.maxLength && v.length > c.maxLength) {
      v = v.slice(0, c.maxLength);
    }
    if (c.minLength && v.length < c.minLength) {
      while (v.length < c.minLength) v += fdfRandomInt(0, 9);
    }
    return v;
  }

  function fdfMakeEmail() {
    const first = fdfRandomItem(FDF_FIRST_NAMES).toLowerCase();
    const last = fdfRandomItem(FDF_LAST_NAMES).toLowerCase();
    return `${first}.${last}${fdfRandomInt(1, 99)}@${fdfRandomItem(FDF_DOMAINS)}`;
  }

  function fdfMakeUsername() {
    return `${fdfRandomItem(FDF_FIRST_NAMES).toLowerCase()}${fdfRandomInt(100, 9999)}`;
  }

  function fdfMakePassword() {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnpqrstuvwxyz';
    const digits = '23456789';
    const special = '!@#$%^&*';
    const all = upper + lower + digits + special;
    let pwd = fdfRandomItem(upper) + fdfRandomItem(lower) + fdfRandomItem(digits) + fdfRandomItem(special);
    while (pwd.length < 12) pwd += fdfRandomItem(all);
    return pwd.split('').sort(() => Math.random() - 0.5).join('');
  }

  function fdfMakePhone(c) {
    const area = fdfRandomInt(200, 989);
    const mid = fdfRandomInt(200, 989);
    const last = fdfRandomDigits(4);
    if (c.maxLength && c.maxLength <= 10) {
      return `${area}${mid}${last}`.slice(0, c.maxLength);
    }
    return `(${area}) ${mid}-${last}`;
  }

  function fdfMakeUrl() {
    return `https://www.${fdfRandomItem(FDF_WORDS)}${fdfRandomInt(1, 999)}.com`;
  }

  function fdfMakeZip() {
    return String(fdfRandomInt(10000, 99999));
  }

  function fdfMakeStreetAddress() {
    return `${fdfRandomInt(100, 9999)} ${fdfRandomItem(FDF_STREETS)}`;
  }

  function fdfMakeSentence() {
    const len = fdfRandomInt(6, 12);
    const words = [];
    for (let i = 0; i < len; i++) words.push(fdfRandomItem(FDF_WORDS));
    const sentence = words.join(' ');
    return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
  }

  function fdfMakeColor() {
    let hex = '#';
    for (let i = 0; i < 6; i++) hex += '0123456789abcdef'[fdfRandomInt(0, 15)];
    return hex;
  }

  function fdfMakeExpiry() {
    const now = new Date();
    const month = String(fdfRandomInt(1, 12)).padStart(2, '0');
    const year = String((now.getFullYear() + fdfRandomInt(1, 5)) % 100).padStart(2, '0');
    return `${month}/${year}`;
  }

  function fdfFormatDate(d) {
    return d.toISOString().slice(0, 10);
  }

  function fdfMakeDate(semanticType, c) {
    const now = new Date();
    let d;
    if (semanticType === 'birthdate') {
      d = new Date(now.getFullYear() - fdfRandomInt(18, 65), fdfRandomInt(0, 11), fdfRandomInt(1, 28));
    } else {
      d = new Date(now.getTime() + fdfRandomInt(-30, 30) * 86400000);
    }
    if (c.min) {
      const minD = new Date(c.min);
      if (!isNaN(minD.getTime()) && d < minD) d = minD;
    }
    if (c.max) {
      const maxD = new Date(c.max);
      if (!isNaN(maxD.getTime()) && d > maxD) d = maxD;
    }
    return fdfFormatDate(d);
  }

  function fdfMakeNumber(semanticType, c) {
    let min = c.min !== null ? Number(c.min) : semanticType === 'age' ? 18 : 1;
    let max = c.max !== null ? Number(c.max) : semanticType === 'age' ? 65 : 100;
    if (isNaN(min)) min = 0;
    if (isNaN(max) || max < min) max = min + 100;
    // Guard against a malformed/zero `step` attribute — dividing by it would
    // produce Infinity/NaN and write the literal string "NaN" into the field.
    const parsedStep = c.step ? Number(c.step) : NaN;
    const step = !isNaN(parsedStep) && parsedStep > 0 ? parsedStep : 1;
    const stepCount = Math.max(Math.floor((max - min) / step), 0);
    const val = min + step * fdfRandomInt(0, stepCount);
    return String(Math.round(val * 1000) / 1000);
  }

  function fdfGetSharedPassword(ctx, el) {
    const scope = el.form || el.ownerDocument;
    if (!ctx.passwordMap.has(scope)) {
      ctx.passwordMap.set(scope, fdfMakePassword());
    }
    return ctx.passwordMap.get(scope);
  }

  function fdfGenerateValue(el, semanticType, ctx) {
    const c = fdfGetConstraints(el);
    const nativeType = (el.type || 'text').toLowerCase();

    // Native input type dictates required format regardless of semantic guess.
    if (nativeType === 'email') return fdfFitConstraints(fdfMakeEmail(), c);
    if (nativeType === 'tel') return fdfFitConstraints(fdfMakePhone(c), c);
    if (nativeType === 'url') return fdfFitConstraints(fdfMakeUrl(), c);
    if (nativeType === 'number' || nativeType === 'range') return fdfMakeNumber(semanticType, c);
    if (nativeType === 'date') return fdfMakeDate(semanticType, c);
    if (nativeType === 'month') {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    if (nativeType === 'week') {
      const d = new Date();
      return `${d.getFullYear()}-W${String(fdfRandomInt(1, 52)).padStart(2, '0')}`;
    }
    if (nativeType === 'time') {
      return `${String(fdfRandomInt(0, 23)).padStart(2, '0')}:${String(fdfRandomInt(0, 59)).padStart(2, '0')}`;
    }
    if (nativeType === 'datetime-local') {
      return `${fdfMakeDate(semanticType, c)}T${String(fdfRandomInt(0, 23)).padStart(2, '0')}:${String(fdfRandomInt(0, 59)).padStart(2, '0')}`;
    }
    if (nativeType === 'color') return fdfMakeColor();
    if (nativeType === 'password') return fdfGetSharedPassword(ctx, el);

    switch (semanticType) {
      case 'email':
        return fdfFitConstraints(fdfMakeEmail(), c);
      case 'password':
      case 'confirmPassword':
        return fdfGetSharedPassword(ctx, el);
      case 'username':
        return fdfFitConstraints(fdfMakeUsername(), c);
      case 'firstName':
        return fdfFitConstraints(fdfRandomItem(FDF_FIRST_NAMES), c);
      case 'lastName':
        return fdfFitConstraints(fdfRandomItem(FDF_LAST_NAMES), c);
      case 'fullName':
        return fdfFitConstraints(`${fdfRandomItem(FDF_FIRST_NAMES)} ${fdfRandomItem(FDF_LAST_NAMES)}`, c);
      case 'phone':
        return fdfFitConstraints(fdfMakePhone(c), c);
      case 'zip':
        return fdfFitConstraints(fdfMakeZip(), c);
      case 'city':
        return fdfFitConstraints(fdfRandomItem(FDF_CITIES), c);
      case 'state':
        return fdfFitConstraints(fdfRandomItem(FDF_STATES)[1], c);
      case 'country':
        return fdfFitConstraints('United States', c);
      case 'address':
        return fdfFitConstraints(fdfMakeStreetAddress(), c);
      case 'address2':
        return fdfFitConstraints(`Apt ${fdfRandomInt(1, 40)}`, c);
      case 'company':
        return fdfFitConstraints(fdfRandomItem(FDF_COMPANIES), c);
      case 'url':
        return fdfFitConstraints(fdfMakeUrl(), c);
      case 'birthdate':
        return fdfMakeDate('birthdate', c);
      case 'age':
        return fdfMakeNumber('age', c);
      case 'ccNumber':
        return fdfFitConstraints('4242424242424242', c);
      case 'cvv':
        return fdfFitConstraints(fdfRandomDigits(3), c);
      case 'ccExpiry':
        return fdfMakeExpiry();
      case 'otp':
        return fdfFitConstraints(fdfRandomDigits(c.maxLength && c.maxLength <= 8 ? c.maxLength : 6), c);
      case 'message':
        return fdfFitConstraints(fdfMakeSentence(), c);
      case 'search':
        return fdfRandomItem(FDF_WORDS);
      default:
        return fdfFitConstraints(fdfRandomItem(FDF_WORDS), c);
    }
  }

  // Sets a value the way a real user interaction would, so frameworks like
  // React (which override the native `value` setter to track dirty state)
  // still pick up the change via their input/change listeners.
  function fdfSetNativeValue(el, value) {
    // Use the element's OWN window, not the top frame's — a same-origin
    // iframe has its own realm, so a framework loaded inside it (e.g. React)
    // overrides the `value` setter on ITS OWN HTMLInputElement.prototype, not
    // the top frame's. Using the wrong realm's prototype silently no-ops.
    const view = el.ownerDocument.defaultView || window;
    const proto =
      el.tagName === 'TEXTAREA'
        ? view.HTMLTextAreaElement.prototype
        : el.tagName === 'SELECT'
          ? view.HTMLSelectElement.prototype
          : view.HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
    if (descriptor && descriptor.set) {
      descriptor.set.call(el, value);
    } else {
      el.value = value;
    }
    const EventCtor = view.Event || Event;
    el.dispatchEvent(new EventCtor('input', { bubbles: true }));
    el.dispatchEvent(new EventCtor('change', { bubbles: true }));
  }

  function fdfHasExistingValue(el) {
    if (el.tagName === 'SELECT') return el.value !== '';
    return el.value != null && String(el.value).trim().length > 0;
  }

  function fdfFillSelect(el) {
    const options = Array.from(el.options).filter(
      o => !o.disabled && o.value !== '' && !/^(select|choose|pick|--)/i.test(o.textContent.trim())
    );
    if (!options.length) return false;
    fdfSetNativeValue(el, fdfRandomItem(options).value);
    return true;
  }

  function fdfCollectFillableElements(root) {
    const selector = [
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]):not([type="file"]):not([disabled]):not([readonly])',
      'select:not([disabled])',
      'textarea:not([disabled]):not([readonly])'
    ].join(',');
    return Array.from(root.querySelectorAll(selector));
  }

  // Collects the top document plus any same-origin iframe documents.
  // Cross-origin iframes throw on `.contentDocument` access — caught and
  // skipped, which is also the correct/safe behavior (e.g. embedded
  // payment widgets should never be auto-filled from the parent page).
  function fdfGetAccessibleDocuments() {
    const docs = [document];
    const iframes = document.querySelectorAll('iframe');
    for (const frame of iframes) {
      try {
        const doc = frame.contentDocument;
        if (doc) docs.push(doc);
      } catch (e) {
        // Cross-origin iframe, inaccessible — skip.
      }
    }
    return docs;
  }

  // Groups radio inputs by (scope, name) since only one option in a group can
  // ever be selected — a group is one logical field, not N separate ones.
  // Nameless radios can't be grouped with siblings, so each becomes its own
  // singleton group.
  function fdfGroupRadios(elements) {
    const groupsByScope = new Map(); // scope -> Map(name -> radios[])
    let unnamedCounter = 0;

    for (const el of elements) {
      if ((el.type || '').toLowerCase() !== 'radio') continue;
      const scope = el.form || el.ownerDocument;
      if (!groupsByScope.has(scope)) groupsByScope.set(scope, new Map());
      const groups = groupsByScope.get(scope);
      const key = el.name || `__unnamed_${unnamedCounter++}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(el);
    }

    const radioGroups = [];
    for (const groups of groupsByScope.values()) {
      for (const group of groups.values()) radioGroups.push(group);
    }
    return radioGroups;
  }

  /**
   * Scans the page for fillable form fields and populates them with
   * constraint-aware fake data, dispatching the events frameworks expect.
   */
  function fillFormsOnPage(options) {
    const opts = {
      onlyRequired: !!options.onlyRequired,
      overwriteFilled: options.overwriteFilled !== false,
      checkOptionalCheckboxes: !!options.checkOptionalCheckboxes
    };

    const rawElements = fdfGetAccessibleDocuments()
      .flatMap(doc => fdfCollectFillableElements(doc))
      .filter(fdfIsVisible);

    // Build logical work items: a radio group counts as ONE field (only one
    // option can ever be selected), everything else counts as itself — this
    // matches how a real user perceives "how many fields are on this form."
    const nonRadioElements = rawElements.filter(el => (el.type || '').toLowerCase() !== 'radio');
    const radioGroups = fdfGroupRadios(rawElements);
    const workItems = [
      ...radioGroups.map(group => ({ kind: 'radioGroup', group })),
      ...nonRadioElements.map(el => ({ kind: 'element', el }))
    ];

    const ctx = { passwordMap: new Map() };
    let filled = 0;
    let skipped = 0;
    const skipReasons = {};

    function markSkipped(reason) {
      skipped++;
      skipReasons[reason] = (skipReasons[reason] || 0) + 1;
    }

    for (const item of workItems) {
      try {
        if (item.kind === 'radioGroup') {
          const group = item.group.filter(r => !r.disabled);
          if (!group.length) {
            markSkipped('All options in radio group are disabled');
            continue;
          }

          const isRequired = group.some(r => r.required);
          if (opts.onlyRequired && !isRequired) {
            markSkipped('Not a required field');
            continue;
          }

          const shouldConsider = isRequired || opts.checkOptionalCheckboxes;
          if (!shouldConsider) {
            markSkipped('Optional radio group left unselected');
            continue;
          }

          const alreadyChecked = group.some(r => r.checked);
          if (alreadyChecked && !opts.overwriteFilled) {
            markSkipped('Already had a value');
            continue;
          }

          const target = fdfRandomItem(group);
          if (!target.checked) target.click();
          filled++;
          continue;
        }

        const el = item.el;

        if (opts.onlyRequired && !el.required) {
          markSkipped('Not a required field');
          continue;
        }
        if (!opts.overwriteFilled && fdfHasExistingValue(el)) {
          markSkipped('Already had a value');
          continue;
        }

        if (el.tagName === 'SELECT') {
          if (fdfFillSelect(el)) filled++;
          else markSkipped('Dropdown has no selectable options');
          continue;
        }

        const nativeType = (el.type || '').toLowerCase();

        if (nativeType === 'checkbox') {
          if (el.required || opts.checkOptionalCheckboxes) {
            if (!el.checked) el.click();
            filled++;
          } else {
            markSkipped('Optional checkbox left unchecked');
          }
          continue;
        }

        const signature = fdfBuildSignature(el);
        const semanticType = fdfDetectFieldType(el, signature);
        const value = fdfGenerateValue(el, semanticType, ctx);
        fdfSetNativeValue(el, value);
        filled++;
      } catch (err) {
        markSkipped('Internal error: ' + (err.message || String(err)));
      }
    }

    return { total: workItems.length, filled, skipped, skipReasons };
  }
}
