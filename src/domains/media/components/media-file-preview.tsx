"use client";

import React from 'react';
import { Document, Music, Video } from '@carbon/icons-react';

interface MediaFilePreviewProps {
  file: File;
  className?: string;
}

const isImage = (type: string) => /^image\//.test(type);
const isVideo = (type: string) => /^video\//.test(type);
const isAudio = (type: string) => /^audio\//.test(type);

export const MediaFilePreview: React.FC<MediaFilePreviewProps> = ({ file, className = '' }) => {
  if (isImage(file.type)) {
    const url = URL.createObjectURL(file);
    return (
      <div className={`media-file-preview ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={file.name} className="media-file-preview__image" />
      </div>
    );
  }

  // Non-image placeholder
  const Icon = isVideo(file.type) ? Video : isAudio(file.type) ? Music : Document;
  return (
    <div className={`media-file-preview media-file-preview--placeholder ${className}`}>
      <Icon size={24} />
      <span className="media-file-preview__filename">{file.name}</span>
    </div>
  );
};

export default MediaFilePreview;


