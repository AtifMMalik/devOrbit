import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  ChevronDown,
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
  defaultCollapsed = true,
}) => {
  const [inputText, setInputText] = useState('');
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;

  const handleAdd = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!inputText.trim()) return;
    onAdd(inputText.trim());
    setInputText('');
  };

  const IconComponent = type === 'testing' ? FlaskConical : ListTodo;
  const accentColor = type === 'testing' ? 'var(--color-accent)' : 'var(--color-primary)';

  return (
    <details
      className="card checklist-section-details"
      open={isOpen}
      onToggle={(e) => setIsOpen(e.currentTarget.open)}
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        transition: 'border-color var(--transition-fast)',
      }}
    >
      {/* Native <summary> for full-width clickable header */}
      <summary
        className="checklist-summary"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-3) var(--space-4)',
          cursor: 'pointer',
          userSelect: 'none',
          listStyle: 'none',
          outline: 'none',
          backgroundColor: isOpen ? 'var(--bg-surface-active)' : 'transparent',
          transition: 'background-color var(--transition-fast)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
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
                backgroundColor: 'var(--bg-surface)',
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {completedCount}/{totalCount}
            </span>
          </h3>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            color: 'var(--text-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform var(--transition-fast)',
          }}
        >
          <ChevronDown size={15} />
        </div>
      </summary>

      {/* Expanded Checklist Body */}
      <div
        style={{
          padding: 'var(--space-3) var(--space-4)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2-5)',
        }}
      >
        {/* Quick Add Input Bar */}
        <form
          onSubmit={handleAdd}
          onClick={(e) => e.stopPropagation()}
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
              maxHeight: '240px',
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
                    border: 'none',
                    background: 'none',
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
    </details>
  );
};
