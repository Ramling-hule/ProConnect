"use client";
import React, { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader } from 'lucide-react';
import PostActions from '@/Components/PostActions';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6001';

export default function PublicPostPage() {
  const params = useParams();
  const postId = params?.postId;

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!postId) return;
    const fetchPost = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/public/post/${postId}`);
        if (res.ok) {
          const data = await res.json();
          setPost(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to fetch post:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader className="animate-spin text-blue-600 mr-2" size={32} />
        <span className="text-lg text-slate-500">Loading post...</span>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-center py-24">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Post Not Found</h1>
        <Link href="/discover" className="text-blue-600 mt-4 inline-block hover:underline">Return to Discover</Link>
      </div>
    );
  }

  const hasImage = post.media?.url || post.image;

  return (
    <div className="max-w-2xl mx-auto p-4 mt-16">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 flex items-center gap-3">
          <Link href={`/people/${post.author?.username}`}>
            <img 
              src={post.author?.profilePicture || '/default-avatar.svg'} 
              alt={post.author?.name} 
              className="w-12 h-12 rounded-full object-cover"
            />
          </Link>
          <div>
            <Link href={`/people/${post.author?.username}`} className="font-bold text-gray-900 dark:text-white hover:underline">
              {post.author?.name}
            </Link>
            <p className="text-xs text-gray-500 dark:text-gray-400">{post.author?.headline}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="p-4 pt-0">
          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{post.text}</p>
        </div>
        {hasImage && (
          <div className="w-full bg-gray-100 dark:bg-gray-900">
            <img 
              src={post.media?.url || post.image} 
              alt="Post attachment" 
              className="w-full max-h-96 object-contain"
            />
          </div>
        )}
        <div className="px-4 py-3 text-sm text-gray-500 border-b border-gray-100 dark:border-gray-700 flex justify-between">
          <span>{post.likesCount} Likes</span>
          <span>{post.commentsCount} Comments</span>
        </div>

        <PostActions postId={postId} />
      </div>
    </div>
  );
}
