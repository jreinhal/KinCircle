import React, { useState } from 'react';
import { UserPlus, Copy, Check, Mail, Users, Clock, CheckCircle, XCircle, Link2 } from 'lucide-react';
import { FamilyInvite as FamilyInviteType, User, UserRole } from '../types';

interface FamilyInviteProps {
  invites: FamilyInviteType[];
  users: User[];
  currentUser: User;
  onCreateInvite: (invite: FamilyInviteType) => void;
  onCancelInvite: (id: string) => void;
}

const generateInviteCode = (): string => {
  // Generate a readable 8-character code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const FamilyInvite: React.FC<FamilyInviteProps> = ({
  invites,
  users,
  currentUser,
  onCreateInvite,
  onCancelInvite
}) => {
  const [isInviting, setIsInviting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'CONTRIBUTOR' as UserRole
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;

    const newInvite: FamilyInviteType = {
      id: crypto.randomUUID(),
      name: form.name,
      email: form.email,
      role: form.role,
      status: 'pending',
      invitedByUserId: currentUser.id,
      invitedAt: new Date().toISOString(),
      inviteCode: generateInviteCode()
    };

    onCreateInvite(newInvite);
    setIsInviting(false);
    setForm({ name: '', email: '', role: 'CONTRIBUTOR' });
  };

  const copyInviteLink = async (invite: FamilyInviteType) => {
    const inviteUrl = `${window.location.origin}?join=${invite.inviteCode}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedId(invite.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = inviteUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedId(invite.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const copyInviteCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id + '-code');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  const pendingInvites = invites.filter(i => i.status === 'pending');
  const acceptedInvites = invites.filter(i => i.status === 'accepted');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Family Circle</h2>
          <p className="text-slate-500 text-sm mt-1">
            Invite family members to collaborate on care tracking
          </p>
        </div>
        {!isInviting && currentUser.role === UserRole.ADMIN && (
          <button
            onClick={() => setIsInviting(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <UserPlus size={18} />
            Invite Family
          </button>
        )}
      </div>

      {/* Invite Form */}
      {isInviting && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-900 mb-4">Invite a Family Member</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Their Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., David"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email <span className="text-slate-400">(optional)</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="david@email.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="CONTRIBUTOR">Contributor - Can add entries</option>
                  <option value="VIEWER">Viewer - Can only view</option>
                  <option value="ADMIN">Admin - Full access</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600">
              <p>After creating the invite, you'll get a shareable link to send to them via text, email, or any messaging app.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Create Invite
              </button>
              <button
                type="button"
                onClick={() => setIsInviting(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Current Family Members */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Users size={20} className="text-teal-600" />
          Active Members ({users.length})
        </h3>
        <div className="space-y-3">
          {users.map(user => (
            <div
              key={user.id}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-medium">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {user.name}
                    {user.id === currentUser.id && (
                      <span className="ml-2 text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">You</span>
                    )}
                  </p>
                  <p className="text-sm text-slate-500">
                    {user.role === UserRole.ADMIN ? 'Administrator' : user.role === UserRole.CONTRIBUTOR ? 'Contributor' : 'Viewer'}
                  </p>
                </div>
              </div>
              <CheckCircle size={20} className="text-green-500" />
            </div>
          ))}
        </div>
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Clock size={20} className="text-amber-500" />
            Pending Invites ({pendingInvites.length})
          </h3>
          <div className="space-y-3">
            {pendingInvites.map(invite => (
              <div
                key={invite.id}
                className="p-4 bg-amber-50 border border-amber-200 rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-medium">
                      {invite.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{invite.name}</p>
                      <p className="text-sm text-slate-500">
                        {invite.email || 'No email provided'} • Invited {new Date(invite.invitedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onCancelInvite(invite.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Cancel invite"
                  >
                    <XCircle size={18} />
                  </button>
                </div>

                {/* Share Options */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => copyInviteLink(invite)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors"
                  >
                    {copiedId === invite.id ? (
                      <>
                        <Check size={14} className="text-green-600" />
                        <span className="text-green-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Link2 size={14} />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => copyInviteCode(invite.inviteCode, invite.id)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-mono hover:bg-slate-50 transition-colors"
                  >
                    {copiedId === invite.id + '-code' ? (
                      <>
                        <Check size={14} className="text-green-600" />
                        <span className="text-green-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>{invite.inviteCode}</span>
                      </>
                    )}
                  </button>
                  {invite.email && (
                    <a
                      href={`mailto:${invite.email}?subject=Join our KinCircle&body=Hi ${invite.name},%0A%0AI've invited you to help track our family caregiving. Click this link to join:%0A%0A${window.location.origin}?join=${invite.inviteCode}%0A%0AOr use code: ${invite.inviteCode}`}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors"
                    >
                      <Mail size={14} />
                      <span>Email</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {users.length === 1 && pendingInvites.length === 0 && !isInviting && (
        <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus size={32} className="text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">Care is better together</h3>
          <p className="text-slate-500 text-sm mb-4 max-w-md mx-auto">
            Invite siblings or other family members to share the caregiving load.
            They can add their own expenses and see what everyone contributes.
          </p>
          <button
            onClick={() => setIsInviting(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <UserPlus size={18} />
            Invite Your First Family Member
          </button>
        </div>
      )}
    </div>
  );
};

export default FamilyInvite;
