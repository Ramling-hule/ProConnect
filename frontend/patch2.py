import sys

filepath = 'src/Components/GroupChatWindow.js'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    new_lines.append(line)
    if '} catch (error) { toast.error("Action failed"); }' in line:
        if i + 1 < len(lines) and '};' in lines[i+1]:
            new_lines.append(lines[i+1])
            new_lines.append("""
  const handleDeleteGroup = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/groups/${group._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (res.ok) {
        toast.success("Group deleted");
        window.location.href = "/groups";
      } else {
        toast.error("Failed to delete group");
      }
    } catch { toast.error("Error deleting group"); }
  };
""")
            lines[i+1] = ''

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
