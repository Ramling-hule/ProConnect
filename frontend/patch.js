const fs = require('fs');
let code = fs.readFileSync('src/Components/GroupChatWindow.js', 'utf8');

code = code.replace(
  /} catch \(error\) { toast\.error\("Action failed"\); }\n  };\n  const handleDownload = \(url, filename\) => {/,
  `} catch (error) { toast.error("Action failed"); }
  };
  const handleDeleteGroup = async () => {
    try {
      const res = await fetch(\`\${API_BASE_URL}/api/groups/\${group._id}\`, { method: 'DELETE', headers: { Authorization: \`Bearer \${user.token}\` } });
      if (res.ok) {
        toast.success("Group deleted");
        window.location.href = "/groups";
      } else toast.error("Failed");
    } catch { toast.error("Error"); }
  };
  const handleDownload = (url, filename) => {`
);

code = code.replace(
  /<button onClick={\(\) => setShowInviteModal\(true\)} className="flex items-center gap-2 text-xs bg-slate-200 dark:bg-slate-800 px-3 py-2 rounded-full dark:text-white hover:bg-slate-300 transition ml-2"><UserPlus size={14} \/><span className="hidden sm:inline">Invite<\/span><\/button>\n          <\/div>/,
  `<button onClick={() => setShowInviteModal(true)} className="flex items-center gap-2 text-xs bg-slate-200 dark:bg-slate-800 px-3 py-2 rounded-full dark:text-white hover:bg-slate-300 transition ml-2"><UserPlus size={14} /><span className="hidden sm:inline">Invite</span></button>
            {isAdmin && <button onClick={() => { if(confirm('Are you sure you want to delete this group?')) handleDeleteGroup(); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition ml-2" title="Delete Group"><Trash2 size={18} /></button>}
          </div>`
);

fs.writeFileSync('src/Components/GroupChatWindow.js', code);
console.log('done');
