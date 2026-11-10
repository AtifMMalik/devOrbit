import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Blocks,
  Search,
  Check,
  Power,
  Trash2,
  Palette,
  Globe,
  PenTool,
  Timer,
  SpellCheck,
  FileText,
  Clock,
  Upload,
  Info,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useExtensions } from '../../extensions/ExtensionContext';
import { useToast } from '../../context/ToastContext';
import { ThemeIcon } from '../../extensions/assets';

const ICON_MAP = {
  Palette,
  SpellCheck,
  Globe,
  PenTool,
  Timer,
  Blocks,
  FileText,
};

export const ExtensionsSidebarPanel = ({ onSelectExtension }) => {
  const navigate = useNavigate();
  const {
    extensions,
    enableExtension,
    disableExtension,
    deleteExtension,
    logs,
    clearLogs,
    activeThemeId,
  } = useExtensions();

  const { toastSuccess, toastInfo } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All'); // 'All' | 'Themes' | 'Productivity' | 'Tools' | 'Logs'
  const [selectedExtDetail, setSelectedExtDetail] = useState(null);

  const categories = ['All', 'Themes', 'Productivity', 'Tools', 'Activity Logs'];

  const filteredExtensions = extensions.filter((ext) => {
    const matchesSearch =
      ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ext.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (categoryFilter === 'All') return true;
    if (categoryFilter === 'Themes') return ext.type === 'theme' || ext.category === 'Themes';
    if (categoryFilter === 'Productivity') return ext.category === 'Productivity';
    if (categoryFilter === 'Tools') return ext.category === 'Developer Tools' || ext.category === 'Design';
    return true;
  });

  const handleToggle = (ext, e) => {
    e.stopPropagation();
    if (ext.enabled) {
      disableExtension(ext.id);
      toastInfo(`${ext.name} disabled`);
    } else {
      enableExtension(ext.id);
      toastSuccess(`${ext.name} enabled`);
    }
  };

  const handleDelete = (ext, e) => {
    e.stopPropagation();
    deleteExtension(ext.id);
    toastInfo(`${ext.name} uninstalled`);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          padding: 'var(--space-3) var(--space-3) var(--space-2) var(--space-3)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)' }}>
            <Blocks size={16} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
              EXTENSIONS
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {extensions.filter((e) => e.enabled).length}/{extensions.length} active
          </span>
        </div>

        {/* Search Field */}
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search extensions..."
            style={{
              paddingLeft: '28px',
              paddingRight: '10px',
              fontSize: 'var(--text-xs)',
              height: 30,
            }}
          />
          <Search
            size={13}
            style={{
              position: 'absolute',
              left: 9,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Category Filter Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            overflowX: 'auto',
            paddingBottom: '2px',
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                whiteSpace: 'nowrap',
                backgroundColor: categoryFilter === cat ? 'var(--color-primary)' : 'var(--bg-surface-active)',
                color: categoryFilter === cat ? 'var(--color-white)' : 'var(--text-secondary)',
                fontWeight: categoryFilter === cat ? 'var(--font-weight-medium)' : 'normal',
                cursor: 'pointer',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Panel Content List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-2)' }}>
        {categoryFilter === 'Activity Logs' ? (
          /* Activity Logs View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'var(--font-weight-medium)' }}>
                EXTENSION ACTIVITY LOGS
              </span>
              <button
                type="button"
                onClick={clearLogs}
                style={{ fontSize: '11px', color: 'var(--status-hotfix-text)', cursor: 'pointer' }}
              >
                Clear
              </button>
            </div>

            {logs.length === 0 ? (
              <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                No extension activity recorded yet.
              </div>
            ) : (
              logs.map((log) => {
                const actionColor =
                  log.action === 'enable'
                    ? 'var(--status-done-text)'
                    : log.action === 'disable'
                    ? 'var(--status-later-text)'
                    : log.action === 'delete'
                    ? 'var(--status-hotfix-text)'
                    : 'var(--color-primary)';

                return (
                  <div
                    key={log.id}
                    style={{
                      padding: 'var(--space-2)',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                      fontSize: '11px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                        {log.extensionName}
                      </span>
                      <span
                        className="badge"
                        style={{
                          textTransform: 'uppercase',
                          fontSize: '9px',
                          color: actionColor,
                          border: `1px solid ${actionColor}`,
                        }}
                      >
                        {log.action}
                      </span>
                    </div>
                    <p style={{ margin: '2px 0', color: 'var(--text-secondary)' }}>
                      {log.details}
                    </p>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Extensions List View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredExtensions.map((ext) => {
              const IconComponent = ICON_MAP[ext.icon] || Blocks;
              const isSelected = selectedExtDetail?.id === ext.id;
              const isCurrentActiveTheme = ext.type === 'theme' && activeThemeId === ext.id;

              return (
                <div
                  key={ext.id}
                  onClick={() => setSelectedExtDetail(isSelected ? null : ext)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 'var(--space-2) var(--space-2-5)',
                    backgroundColor: isSelected ? 'var(--bg-surface-active)' : 'var(--bg-surface)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: ext.enabled ? 'var(--color-primary-light)' : 'var(--bg-surface-active)',
                          color: ext.enabled ? 'var(--color-primary)' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {ext.type === 'theme' ? (
                          <ThemeIcon themeId={ext.id} size={18} />
                        ) : (
                          <IconComponent size={15} />
                        )}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }} className="truncate">
                            {ext.name}
                          </span>
                          {isCurrentActiveTheme && (
                            <span className="badge" style={{ backgroundColor: 'var(--status-done-bg)', color: 'var(--status-done-text)', fontSize: '9px', padding: '0 4px' }}>
                              Active
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          v{ext.version} • {ext.author}
                        </span>
                      </div>
                    </div>

                    {/* Enable / Disable and Delete Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={(e) => handleToggle(ext, e)}
                        className="btn-icon"
                        style={{
                          width: 24,
                          height: 24,
                          color: '#ffffff',
                          backgroundColor: ext.enabled ? 'var(--status-done-solid, #10b981)' : 'var(--text-muted, #64748b)',
                          borderRadius: 'var(--radius-xs)',
                        }}
                        title={ext.enabled ? 'Disable Extension' : 'Enable Extension'}
                      >
                        <Power size={13} color="#ffffff" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(ext, e)}
                        style={{
                          width: 24,
                          height: 24,
                          color: 'var(--color-danger, #f43f5e)',
                          background: 'transparent',
                          backgroundColor: 'transparent',
                          border: '1px solid var(--border-default)',
                          borderRadius: 'var(--radius-xs)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          transition: 'all var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-danger, #f43f5e)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-default)';
                        }}
                        title="Uninstall / Delete Extension"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <p
                    style={{
                      margin: '4px 0 0 0',
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      lineHeight: 'var(--leading-snug)',
                    }}
                  >
                    {ext.description}
                  </p>

                  {/* Expanded detail box */}
                  {isSelected && (
                    <div
                      style={{
                        marginTop: 'var(--space-2)',
                        paddingTop: 'var(--space-2)',
                        borderTop: '1px solid var(--border-subtle)',
                        fontSize: '11px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span>Category:</span>
                        <span style={{ color: 'var(--text-primary)' }}>{ext.category}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span>Directory:</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-primary)' }}>{ext.directory}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span>Status:</span>
                        <span style={{ color: ext.enabled ? 'var(--status-done-text)' : 'var(--text-muted)', fontWeight: 'bold' }}>
                          {ext.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/extensions/${ext.id}`);
                        }}
                        style={{
                          marginTop: 'var(--space-1)',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--color-primary-light)',
                          color: 'var(--color-primary)',
                          border: '1px solid var(--color-primary-border)',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        <span>View Full Extension Details</span>
                        <ExternalLink size={11} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

