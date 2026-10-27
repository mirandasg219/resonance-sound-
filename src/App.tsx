/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PageId, Project } from './types/project';
import { getStoredProjects, saveStoredProjects } from './data/projectsData';
import {
  SiteContent,
  getStoredSiteContent,
  saveStoredSiteContent,
  resetStoredSiteContent,
} from './data/siteContent';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { StudioPage } from './pages/StudioPage';
import { ContactPage } from './pages/ContactPage';
import { SiteContentEditorModal } from './components/SiteContentEditorModal';
import { BaseAudioModal } from './components/BaseAudioModal';
import { PermanentProjectsSync } from './components/PermanentProjectsSync';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [projects, setProjects] = useState<Project[]>(() => getStoredProjects());
  const [siteContent, setSiteContent] = useState<SiteContent>(() => getStoredSiteContent());
  const [targetProjectId, setTargetProjectId] = useState<string | null>(null);
  const [isContentEditorOpen, setIsContentEditorOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);

  // Handle URL hash changes for deep linking
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'projects' || hash === 'studio' || hash === 'contact' || hash === 'home') {
        setCurrentPage(hash as PageId);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Keyboard shortcut: Shift + E to toggle the Live Text Editor from anywhere
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'E' || e.key === 'e')) {
        // Prevent toggle if currently typing inside an input/textarea
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
        e.preventDefault();
        setIsContentEditorOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (page: PageId, projectId?: string) => {
    setCurrentPage(page);
    window.location.hash = page;
    if (projectId) {
      setTargetProjectId(projectId);
    }
    // Scroll to top when switching non-map pages
    if (page !== 'projects') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleUpdateProjects = (updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    saveStoredProjects(updatedProjects);
  };

  const handleUpdateSiteContent = (updatedContent: SiteContent) => {
    setSiteContent(updatedContent);
    saveStoredSiteContent(updatedContent);
  };

  const handleResetSiteContent = () => {
    const fresh = resetStoredSiteContent();
    setSiteContent(fresh);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0c10] text-[#f3f4f6] selection:bg-[#a855f7]/25 selection:text-[#c084fc]">
      <Header
        currentPage={currentPage}
        onNavigate={handleNavigate}
        businessName={siteContent.brand.name}
      />

      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            projects={projects}
            onNavigate={handleNavigate}
            content={siteContent.home}
          />
        )}

        {currentPage === 'projects' && (
          <ProjectsPage
            projects={projects}
            onUpdateProjects={handleUpdateProjects}
            initialSelectedProjectId={targetProjectId}
            onClearInitialProject={() => setTargetProjectId(null)}
            studioEmail={siteContent.brand.studioEmail}
            onNavigateContact={() => handleNavigate('contact')}
          />
        )}

        {currentPage === 'studio' && (
          <StudioPage
            onNavigate={handleNavigate}
            content={siteContent.studio}
          />
        )}

        {currentPage === 'contact' && (
          <ContactPage
            studioEmail={siteContent.brand.studioEmail}
            content={siteContent.contact}
          />
        )}
      </main>

      {/* Show footer on standard content pages */}
      {currentPage !== 'projects' && (
        <Footer
          onNavigate={handleNavigate}
          businessName={siteContent.brand.name}
          studioEmail={siteContent.brand.studioEmail}
          footerNote={siteContent.brand.footerNote}
        />
      )}

      {/* In-App Live Text & Writing Editor Modal */}
      <SiteContentEditorModal
        isOpen={isContentEditorOpen}
        onClose={() => setIsContentEditorOpen(false)}
        content={siteContent}
        onSave={handleUpdateSiteContent}
        onReset={handleResetSiteContent}
      />

      {/* Base Audio Soundtrack Manager Modal */}
      <BaseAudioModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
      />

      {/* Auto-commit local projects to source code */}
      <PermanentProjectsSync />
    </div>
  );
}
