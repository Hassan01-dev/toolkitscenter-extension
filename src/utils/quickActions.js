// One-click tool actions: run to completion and return a short success
// message, or throw an Error with a user-facing message on failure.

export async function clearCookiesForActiveTab(activeTab) {
  if (!activeTab || !activeTab.url) {
    throw new Error('No active tab detected.');
  }

  const cookies = await chrome.cookies.getAll({ url: activeTab.url });
  if (cookies.length === 0) {
    return 'No cookies to clear';
  }

  let deletedCount = 0;
  for (const cookie of cookies) {
    const protocol = cookie.secure ? 'https:' : 'http:';
    const cookieUrl = `${protocol}//${cookie.domain}${cookie.path}`;
    await chrome.cookies.remove({
      url: cookieUrl,
      name: cookie.name,
      storeId: cookie.storeId
    });
    deletedCount++;
  }

  return `Cleared ${deletedCount} cookie${deletedCount === 1 ? '' : 's'}`;
}

export async function fillFormsForActiveTab(activeTab) {
  if (!activeTab) {
    throw new Error('No active tab detected.');
  }

  await chrome.scripting.executeScript({
    target: { tabId: activeTab.id },
    files: ['formFiller.js']
  });

  const response = await chrome.tabs.sendMessage(activeTab.id, {
    action: 'fill_forms',
    options: { onlyRequired: false, overwriteFilled: true, checkOptionalCheckboxes: true }
  });

  if (response && response.error) {
    throw new Error(response.error);
  }
  if (!response || response.total === 0) {
    return 'No form fields found';
  }

  return `Filled ${response.filled}/${response.total} field${response.total === 1 ? '' : 's'}`;
}
