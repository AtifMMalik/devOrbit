import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ListTodo,
  FlaskConical,
} from 'lucide-react';
import { Button } from '../common/Button';

export const ProjectChecklistSection = ({
  title, // 'To Dos' | 'Testing'
  type = 'todos', // 'todos' | 'testing'
  items = [],
  onAdd,
  onToggle,
  onUpdate,
  onDelete,
  placeholder = 'Add new item...',
}) => {
  const [inputText, setInputText] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;

  const handleAdd = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onAdd(inputText.trim());
    setInputText('');
  };

  const IconComponent = type === 'testing' ? FlaskConical : ListTodo;
  const accentColor = type === 'testing' ? 'var(--color-accent)' : 'var(--color-primary)';

  return (
    <div
      className="card"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-3) var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: isCollapsed ? 0 : 'var(--space-2-5)',
        transition: 'all var(--transition-fast)',
      }}
    >
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none',
        }}
      >
        <div
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 'var(--radius-xs)',
              backgroundColor: type === 'testing' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(0, 132, 255, 0.12)',
              color: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconComponent size={13} />
          </div>

          <h3
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1-5)',
            }}
          >
            <span>{title}</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 'var(--font-weight-normal)',
                color: completedCount === totalCount && totalCount > 0 ? 'var(--status-done-solid)' : 'var(--text-muted)',
                backgroundColor: 'var(--bg-surface-active)',
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {completedCount}/{totalCount}
            </span>
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="btn-icon"
            style={{ width: 22, height: 22 }}
            title={isCollapsed ? `Expand ${title}` : `Collapse ${title}`}
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded Checklist Body */}
      {!isCollapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {/* Quick Add Input Bar */}
          <form
            onSubmit={handleAdd}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={placeholder}
              style={{
                flex: 1,
                fontSize: 'var(--text-xs)',
                padding: '6px 10px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
              }}
            />
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              icon={Plus}
              disabled={!inputText.trim()}
              style={{ flexShrink: 0, padding: '5px 10px' }}
            >
              Add
            </Button>
          </form>

          {/* Checklist Items */}
          {items.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                maxHeight: '220px',
                overflowY: 'auto',
                paddingRight: 2,
              }}
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: '4px 8px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-subtle)',
                    width: '100%',
                    boxSizing: 'border-box',
                    transition: 'background-color var(--transition-fast)',
                  }}
                >
                  {/* Square Checkbox Toggle */}
                  <button
                    type="button"
                    onClick={() => onToggle(item.id)}
                    style={{
                      color: item.completed ? 'var(--status-done-solid)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0,
                      flexShrink: 0,
                    }}
                    title={item.completed ? 'Mark pending' : 'Mark completed'}
                  >
                    {item.completed ? (
                      <CheckSquare size={15} />
                    ) : (
                      <Square size={15} />
                    )}
                  </button>

                  {/* Inline Editable Text Field */}
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => onUpdate(item.id, e.target.value)}
                    placeholder="Checklist item description..."
                    style={{
                      flex: 1,
                      fontSize: 'var(--text-xs)',
                      color: item.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: item.completed ? 'line-through' : 'none',
                      backgroundColor: 'transparent',
                      border: 'none',
                      padding: '2px 4px',
                      borderRadius: 'var(--radius-xs)',
                      outline: 'none',
                    }}
                  />

                  {/* Red Delete Button */}
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="btn-icon btn-icon-danger"
                    style={{
                      color: '#f43f5e',
                      cursor: 'pointer',
                      border: 'none',
                      background: 'none',
                      padding: '3px',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 'var(--radius-xs)',
                      flexShrink: 0,
                    }}
                    title="Delete item"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {items.length === 0 && (
            <div
              style={{
                padding: 'var(--space-2) var(--space-3)',
                fontSize: '11px',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
                textAlign: 'left',
              }}
            >
              No {title.toLowerCase()} added yet. Type above to add a checklist item.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
