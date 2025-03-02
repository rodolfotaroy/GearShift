import { Button } from '../components';
import { useState, useEffect, useRef } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { Document, Car, DOCUMENT_TYPES } from '../types';
import { PlusIcon, DocumentIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { DateTime } from 'luxon';

interface DocumentViewProps {
    car: Car;
}

export default function DocumentView({ car }: DocumentViewProps) {
    const { supabaseClient, supabaseAuth } = useSupabase();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddDocument, setShowAddDocument] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [newDocument, setNewDocument] = useState({
        document_type: DOCUMENT_TYPES[0],
        title: '',
        expiry_date: '',
        description: ''
    });

    useEffect(() => {
        fetchDocuments();
    }, [car.id]);

    async function fetchDocuments() {
        setLoading(true);
        try {
            const { data, error } = await supabaseClient
                .from('documents')
                .select('*')
                .eq('car_id', car.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDocuments(data || []);
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    }

    async function uploadDocument() {
        if (!selectedFile || !newDocument.document_type || !newDocument.title) {
            alert('Please fill in all required fields and select a file');
            return;
        }

        try {
            const { data: { user } } = await supabaseAuth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Upload file to storage
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${car.id}-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabaseClient.storage
                .from('car-documents')
                .upload(fileName, selectedFile);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabaseClient.storage
                .from('car-documents')
                .getPublicUrl(fileName);

            // Save document record
            const { error: dbError } = await supabaseClient
                .from('documents')
                .insert([{
                    car_id: car.id,
                    user_id: user.id,
                    file_url: publicUrl,
                    ...newDocument
                }]);

            if (dbError) throw dbError;

            setShowAddDocument(false);
            setSelectedFile(null);
            setNewDocument({
                document_type: DOCUMENT_TYPES[0],
                title: '',
                expiry_date: '',
                description: ''
            });
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            fetchDocuments();
        } catch (error) {
            console.error('Error uploading document:', error);
            alert('Failed to upload document. Please try again.');
        }
    }

    async function deleteDocument(document: Document) {
        try {
            // Delete from storage
            const fileName = document.file_url.split('/').pop();
            if (fileName) {
                await supabaseClient.storage
                    .from('car-documents')
                    .remove([fileName]);
            }

            // Delete from database
            const { error } = await supabaseClient
                .from('documents')
                .delete()
                .eq('id', document.id);

            if (error) throw error;
            fetchDocuments();
        } catch (error) {
            console.error('Error deleting document:', error);
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setSelectedFile(file || null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Documents</h3>
                <Button
                    type="button"
                    onClick={() => setShowAddDocument(true)}
                    variant="default"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Document
                </Button>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                {documents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No documents uploaded for this car
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {documents.map((document) => (
                            <li key={document.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <DocumentIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {document.title}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {document.document_type}
                                                {document.expiry_date && 
                                                    ` • Expires: ${DateTime.fromISO(document.expiry_date).toFormat('yyyy/MM/dd')}`
                                                }
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <a
                                            href={document.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:text-indigo-300 dark:bg-indigo-900 dark:hover:bg-indigo-800"
                                        >
                                            View
                                        </a>
                                        <Button
                                            type="button"
                                            onClick={() => deleteDocument(document)}
                                            variant="default"
                                            className="inline-flex items-center p-2 border border-transparent rounded-full text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Add Document Modal */}
            {showAddDocument && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-6 relative">
                        <button 
                            onClick={() => setShowAddDocument(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add Document</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Document Type</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={newDocument.document_type}
                                    onChange={(e) => setNewDocument({ ...newDocument, document_type: e.target.value as typeof DOCUMENT_TYPES[number] })}
                                >
                                    <option value="">Select a type</option>
                                    {DOCUMENT_TYPES.map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={newDocument.title}
                                    onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                                    placeholder="Enter document title"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Expiry Date (Optional)</label>
                                <input
                                    type="date"
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={newDocument.expiry_date}
                                    onChange={(e) => setNewDocument({ ...newDocument, expiry_date: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description (Optional)</label>
                                <textarea
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={newDocument.description}
                                    onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                                    placeholder="Enter document description"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload Document</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                                    <div className="space-y-1 text-center">
                                        <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                            <label 
                                                htmlFor="file-upload" 
                                                className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                                            >
                                                <span>Upload a file</span>
                                                <input 
                                                    id="file-upload" 
                                                    name="file-upload" 
                                                    type="file" 
                                                    className="sr-only" 
                                                    ref={fileInputRef}
                                                    onChange={handleFileChange}
                                                />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            PDF, DOCX, JPG, PNG up to 10MB
                                        </p>
                                        {selectedFile && (
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                Selected file: {selectedFile.name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <Button
                                    type="button"
                                    onClick={() => setShowAddDocument(false)}
                                    variant="secondary"
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={uploadDocument}
                                    variant="default"
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-md"
                                    disabled={!selectedFile || !newDocument.document_type || !newDocument.title}
                                >
                                    Upload Document
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
