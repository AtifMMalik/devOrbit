import React, { useState, useEffect } from 'react';
import {
  Globe,
  Search,
  Sparkles,
  Plus,
  Check,
  ExternalLink,
  Tag,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import {
  checkDomainAvailability,
  generateAIDomainSuggestions,
  POPULAR_TLDS,
} from './domainService';

export const DomainResearchCard = ({
  projectTitle = '',
  projectDescription = '',
  onAddDomainToDescription,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTlds, setSelectedTlds] = useState(['.com', '.dev', '.io', '.ai', '.app', '.co']);
  const [results, setResults] = useState([]);
  const [addedDomains, setAddedDomains] = useState(new Set());
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Auto-seed search term from project title if available and field is empty
  useEffect(() => {
    if (projectTitle && !searchTerm) {
      const cleanTitle = projectTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanTitle) {
        setSearchTerm(cleanTitle);
      }
    }
  }, [projectTitle]);

  // Execute search when search term or TLD selection changes
  useEffect(() => {
    if (searchTerm.trim()) {
      const res = checkDomainAvailability(searchTerm, selectedTlds);
      setResults(res);
    } else {
      setResults([]);
    }
  }, [searchTerm, selectedTlds]);

  const handleToggleTld = (tld) => {
    setSelectedTlds((prev) => {
      if (prev.includes(tld)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((item) => item !== tld);
      } else {
        return [...prev, tld];
      }
    });
  };

  const handleGenerateAI = () => {
    setIsGeneratingAI(true);
    setTimeout(() => {
      const aiSuggestions = generateAIDomainSuggestions(projectTitle || searchTerm, projectDescription);
      setResults(aiSuggestions);
      setIsGeneratingAI(false);
    }, 350);
  };

  const handleAddDomain = (domain) => {
    if (onAddDomainToDescription) {
      onAddDomainToDescription(domain);
      setAddedDomains((prev) => new Set([...prev, domain]));
    }
  };

  return (
    <div
      className="card"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      {/* Card Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)',
            }}
          >
            <Globe size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', margin: 0 }}>
                Domain Name Research
              </h3>
              <span className="badge badge-primary" style={{ fontSize: '10px', padding: '1px 6px' }}>
                Extension
              </span>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>
              Search available domain names and attach choices directly to this project idea.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerateAI}
          disabled={isGeneratingAI}
          className="btn-secondary"
          style={{
            fontSize: 'var(--text-xs)',
            padding: 'var(--space-1-5) var(--space-3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-1-5)',
            color: 'var(--color-accent)',
          }}
          title="Generate creative available domains using project context"
        >
          <Sparkles size={14} className={isGeneratingAI ? 'animate-spin' : ''} />
          <span>{isGeneratingAI ? 'Thinking...' : 'AI Domain Suggestions'}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search name (e.g. devorbit, taskpilot, hypercode)..."
          style={{
            width: '100%',
            paddingLeft: '34px',
            fontSize: 'var(--text-xs)',
          }}
        />
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: 11,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Top-Level Domain (TLD) Checkboxes */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', fontWeight: 'var(--font-weight-medium)' }}>
          Filter TLDs:
        </span>
        {POPULAR_TLDS.map(({ tld }) => {
          const isChecked = selectedTlds.includes(tld);
          return (
            <label
              key={tld}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
                fontSize: 'var(--text-2xs)',
                cursor: 'pointer',
                color: isChecked ? 'var(--text-primary)' : 'var(--text-muted)',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => handleToggleTld(tld)}
                style={{ width: 13, height: 13, cursor: 'pointer' }}
              />
              <span>{tld}</span>
            </label>
          );
        })}
      </div>

      {/* Results List */}
      {results.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-1-5)',
            maxHeight: '260px',
            overflowY: 'auto',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: 'var(--space-2)',
          }}
        >
          {results.map((item) => {
            const isAdded = addedDomains.has(item.domain);
            const isAvailable = item.status === 'available' || item.status === 'premium';

            return (
              <div
                key={item.domain}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-1-5) var(--space-2-5)',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-default)',
                  fontSize: 'var(--text-xs)',
                  gap: 'var(--space-2)',
                }}
              >
                {/* Domain & Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
                  <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }} className="truncate">
                    {item.domain}
                  </span>

                  {item.status === 'available' && (
                    <span
                      className="badge"
                      style={{
                        backgroundColor: 'var(--status-done-bg)',
                        color: 'var(--status-done-text)',
                        border: '1px solid var(--status-done-border)',
                        fontSize: '10px',
                      }}
                    >
                      <ShieldCheck size={11} style={{ marginRight: 2 }} /> Available
                    </span>
                  )}

                  {item.status === 'premium' && (
                    <span
                      className="badge"
                      style={{
                        backgroundColor: 'var(--status-later-bg)',
                        color: 'var(--status-later-text)',
                        border: '1px solid var(--status-later-border)',
                        fontSize: '10px',
                      }}
                    >
                      <Tag size={10} style={{ marginRight: 2 }} /> Premium
                    </span>
                  )}

                  {item.status === 'taken' && (
                    <span
                      className="badge"
                      style={{
                        backgroundColor: 'var(--status-hotfix-bg)',
                        color: 'var(--status-hotfix-text)',
                        border: '1px solid var(--status-hotfix-border)',
                        fontSize: '10px',
                      }}
                    >
                      <XCircle size={10} style={{ marginRight: 2 }} /> Taken
                    </span>
                  )}

                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {item.price}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => handleAddDomain(item.domain)}
                    disabled={!isAvailable || isAdded}
                    className="btn-secondary"
                    style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: isAdded ? 'var(--status-done-bg)' : undefined,
                      color: isAdded ? 'var(--status-done-text)' : undefined,
                    }}
                    title="Add domain to project idea description"
                  >
                    {isAdded ? (
                      <>
                        <Check size={12} /> Added
                      </>
                    ) : (
                      <>
                        <Plus size={12} /> Add to Project
                      </>
                    )}
                  </button>

                  <a
                    href={item.registrarUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-icon"
                    style={{ width: 24, height: 24 }}
                    title="Check on Registrar"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

