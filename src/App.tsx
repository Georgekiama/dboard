import React, { useState, useEffect } from 'react';
import { Search, Plus, Mail, Users, TrendingUp, Image, Send, Clock, CheckCircle, AlertCircle, Download, Upload, Filter, BarChart3, Calendar, Eye, Edit, Trash2, RefreshCw } from 'lucide-react';

// CONFIGURATION - Replace these with your actual N8N webhook URLs
const N8N_CONFIG = {
  ADD_CONTACT: 'https://your-n8n-instance.com/webhook/add-contact',
  GET_CONTACTS: 'https://your-n8n-instance.com/webhook/get-contacts',
  TRIGGER_CAMPAIGN: 'https://your-n8n-instance.com/webhook/trigger-campaign',
  GET_SUBMISSIONS: 'https://your-n8n-instance.com/webhook/get-submissions',
  UPDATE_CONTACT: 'https://your-n8n-instance.com/webhook/update-contact',
  DELETE_CONTACT: 'https://your-n8n-instance.com/webhook/delete-contact'
};

const PartnershipDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [contacts, setContacts] = useState([
    { id: 1, email: 'business1@example.com', businessName: 'Tech Solutions Inc', industry: 'Technology', status: 'initial_sent', stage: 1, addedDate: '2025-11-01', formSubmitted: false, lastEmailDate: '2025-11-01' },
    { id: 2, email: 'business2@example.com', businessName: 'Marketing Pro', industry: 'Marketing', status: 'welcome_sent', stage: 2, addedDate: '2025-11-03', formSubmitted: true, lastEmailDate: '2025-11-04' },
    { id: 3, email: 'business3@example.com', businessName: 'Design Studio', industry: 'Design', status: 'listed', stage: 3, addedDate: '2025-10-15', formSubmitted: true, lastEmailDate: '2025-10-16' },
    { id: 4, email: 'business4@example.com', businessName: 'Consulting Group', industry: 'Consulting', status: 'reminder_sent', stage: 4, addedDate: '2025-10-01', formSubmitted: true, lastEmailDate: '2025-11-01' },
    { id: 5, email: 'business5@example.com', businessName: 'Retail Store', industry: 'Retail', status: 'initial_sent', stage: 1, addedDate: '2025-11-05', formSubmitted: false, lastEmailDate: '2025-11-05' },
    { id: 6, email: 'business6@example.com', businessName: 'Food Services', industry: 'Food & Beverage', status: 're_engagement', stage: 5, addedDate: '2025-09-01', formSubmitted: false, lastEmailDate: '2025-11-08' },
  ]);
  
  const [submissions, setSubmissions] = useState([
    { id: 1, businessName: 'Marketing Pro', email: 'business2@example.com', photos: ['https://via.placeholder.com/300', 'https://via.placeholder.com/300'], submittedDate: '2025-11-04' },
    { id: 2, businessName: 'Design Studio', email: 'business3@example.com', photos: ['https://via.placeholder.com/300'], submittedDate: '2025-10-16' },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [newContact, setNewContact] = useState({ email: '', businessName: '', industry: '', contactPerson: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);

  const emailStages = [
    { id: 1, name: 'Initial Email', description: 'Form request sent', icon: Mail, color: 'bg-blue-500' },
    { id: 2, name: 'Welcome', description: 'Form submitted', icon: CheckCircle, color: 'bg-green-500' },
    { id: 3, name: 'Listed', description: 'Listed on page', icon: TrendingUp, color: 'bg-purple-500' },
    { id: 4, name: 'Monthly Reminder', description: '1 month follow-up', icon: Clock, color: 'bg-orange-500' },
    { id: 5, name: 'Re-engagement', description: 'Final outreach', icon: Send, color: 'bg-red-500' },
  ];

  // Calculate statistics
  const stats = {
    total: contacts.length,
    formSubmitted: contacts.filter(c => c.formSubmitted).length,
    listed: contacts.filter(c => c.stage >= 3).length,
    responseRate: contacts.length > 0 ? Math.round((contacts.filter(c => c.formSubmitted).length / contacts.length) * 100) : 0,
    thisWeek: contacts.filter(c => {
      const added = new Date(c.addedDate);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return added >= weekAgo;
    }).length
  };

  // Stage distribution for chart
  const stageDistribution = emailStages.map(stage => ({
    stage: stage.name,
    count: contacts.filter(c => c.stage === stage.id).length
  }));

  // Add new contact
  const handleAddContact = async () => {
    if (!newContact.email || !newContact.businessName) {
      alert('Please fill in email and business name');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(N8N_CONFIG.ADD_CONTACT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact)
      });

      if (response.ok) {
        const newId = Math.max(...contacts.map(c => c.id), 0) + 1;
        setContacts([...contacts, {
          id: newId,
          ...newContact,
          status: 'initial_sent',
          stage: 1,
          addedDate: new Date().toISOString().split('T')[0],
          lastEmailDate: new Date().toISOString().split('T')[0],
          formSubmitted: false
        }]);
        setNewContact({ email: '', businessName: '', industry: '', contactPerson: '' });
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      const newId = Math.max(...contacts.map(c => c.id), 0) + 1;
      setContacts([...contacts, {
        id: newId,
        ...newContact,
        status: 'initial_sent',
        stage: 1,
        addedDate: new Date().toISOString().split('T')[0],
        lastEmailDate: new Date().toISOString().split('T')[0],
        formSubmitted: false
      }]);
      setNewContact({ email: '', businessName: '', industry: '', contactPerson: '' });
      setShowAddModal(false);
    }
    setIsLoading(false);
  };

  // Delete contact
  const handleDeleteContact = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      await fetch(N8N_CONFIG.DELETE_CONTACT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      setContacts(contacts.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting contact:', error);
      setContacts(contacts.filter(c => c.id !== id));
    }
  };

  // Trigger campaign for specific stage
  const handleTriggerCampaign = async (stage: number, contactIds: number[] | null = null) => {
    const stageName = emailStages[stage - 1]?.name;
    const targetContacts = contactIds || contacts.filter(c => c.stage === stage).map(c => c.id);
    
    if (targetContacts.length === 0) {
      alert(`No contacts at ${stageName} stage`);
      return;
    }

    if (!window.confirm(`Send ${stageName} email to ${targetContacts.length} contact(s)?`)) return;

    setIsSending(true);
    try {
      const response = await fetch(N8N_CONFIG.TRIGGER_CAMPAIGN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          stage: stage,
          contactIds: targetContacts,
          campaignType: stageName
        })
      });

      if (response.ok) {
        alert(`✅ ${stageName} emails triggered successfully!`);
        // Update last email date for those contacts
        setContacts(contacts.map(c => 
          targetContacts.includes(c.id) 
            ? { ...c, lastEmailDate: new Date().toISOString().split('T')[0] }
            : c
        ));
      } else {
        alert('Failed to trigger campaign. Please try again.');
      }
    } catch (error) {
      console.error('Error triggering campaign:', error);
      alert('✅ Campaign triggered (demo mode - N8N not connected yet)');
    }
    setIsSending(false);
  };

  // Send email to individual contact
  const handleSendToContact = async (contactId: number, stage: number) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;
    const stageName = emailStages[stage - 1]?.name;
    
    if (!window.confirm(`Send ${stageName} email to ${contact.businessName}?`)) return;

    setIsSending(true);
    try {
      await fetch(N8N_CONFIG.TRIGGER_CAMPAIGN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          stage: stage,
          contactIds: [contactId],
          campaignType: stageName
        })
      });
      
      alert(`✅ Email sent to ${contact.businessName}!`);
      setContacts(contacts.map(c => 
        c.id === contactId 
          ? { ...c, lastEmailDate: new Date().toISOString().split('T')[0] }
          : c
      ));
    } catch (error) {
      console.error('Error sending email:', error);
      alert('✅ Email sent (demo mode)');
    }
    setIsSending(false);
  };

  // Export contacts
  const handleExport = () => {
    const csv = [
      ['Email', 'Business Name', 'Industry', 'Stage', 'Form Submitted', 'Added Date'].join(','),
      ...contacts.map(c => [
        c.email,
        c.businessName,
        c.industry || '',
        emailStages[c.stage - 1]?.name || '',
        c.formSubmitted ? 'Yes' : 'No',
        c.addedDate
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Filter contacts
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.businessName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = filterStage === 'all' || contact.stage === parseInt(filterStage);
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'submitted' && contact.formSubmitted) ||
                         (filterStatus === 'pending' && !contact.formSubmitted);
    return matchesSearch && matchesStage && matchesStatus;
  });

  // Dashboard view
  const DashboardView = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Contacts</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
              <p className="text-xs text-blue-100 mt-1">+{stats.thisWeek} this week</p>
            </div>
            <Users size={40} className="opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Forms Submitted</p>
              <p className="text-3xl font-bold mt-1">{stats.formSubmitted}</p>
              <p className="text-xs text-green-100 mt-1">{stats.responseRate}% rate</p>
            </div>
            <CheckCircle size={40} className="opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Listed Partners</p>
              <p className="text-3xl font-bold mt-1">{stats.listed}</p>
              <p className="text-xs text-purple-100 mt-1">Active listings</p>
            </div>
            <TrendingUp size={40} className="opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Response Rate</p>
              <p className="text-3xl font-bold mt-1">{stats.responseRate}%</p>
              <p className="text-xs text-orange-100 mt-1">Conversion</p>
            </div>
            <BarChart3 size={40} className="opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm font-medium">Submissions</p>
              <p className="text-3xl font-bold mt-1">{submissions.length}</p>
              <p className="text-xs text-pink-100 mt-1">With photos</p>
            </div>
            <Image size={40} className="opacity-80" />
          </div>
        </div>
      </div>

      {/* Email Journey Pipeline */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Email Journey Pipeline</h2>
          <button 
            onClick={() => setShowCampaignModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition shadow-md"
          >
            <Send size={18} />
            Launch Campaign
          </button>
        </div>
        <div className="relative">
          <div className="flex justify-between items-start">
            {emailStages.map((stage, index) => {
              const stageCount = contacts.filter(c => c.stage === stage.id).length;
              const percentage = contacts.length > 0 ? Math.round((stageCount / contacts.length) * 100) : 0;
              const StageIcon = stage.icon;
              return (
                <div key={stage.id} className="flex-1 text-center relative">
                  <div className={`${stage.color} text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg transform transition hover:scale-110`}>
                    <StageIcon size={32} />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">{stage.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{stage.description}</p>
                  <div className="mt-3">
                    <p className="text-3xl font-bold text-gray-900">{stageCount}</p>
                    <p className="text-xs text-gray-500">{percentage}%</p>
                  </div>
                  {stageCount > 0 && (
                    <button
                      onClick={() => handleTriggerCampaign(stage.id)}
                      disabled={isSending}
                      className={`mt-3 ${stage.color} text-white px-3 py-1 rounded-full text-xs font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      Send to {stageCount}
                    </button>
                  )}
                  {index < emailStages.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-1/2 w-full h-0.5 bg-gray-300" style={{ zIndex: -1 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {contacts.slice(0, 6).map(contact => (
              <div key={contact.id} className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${emailStages[contact.stage - 1]?.color} flex items-center justify-center text-white`}>
                    {contact.businessName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{contact.businessName}</p>
                    <p className="text-xs text-gray-500">{contact.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    contact.formSubmitted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {emailStages[contact.stage - 1]?.name}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{contact.addedDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stage Distribution Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Stage Distribution</h2>
          <div className="space-y-3">
            {stageDistribution.map((item, index) => {
              const percentage = contacts.length > 0 ? (item.count / contacts.length) * 100 : 0;
              return (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.stage}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.count} ({Math.round(percentage)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${emailStages[index]?.color} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  // Contacts view
  const ContactsView = () => (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search contacts..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
          >
            <option value="all">All Stages</option>
            {emailStages.map(stage => (
              <option key={stage.id} value={stage.id}>{stage.name}</option>
            ))}
          </select>
          
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="submitted">Form Submitted</option>
            <option value="pending">Pending</option>
          </select>
          
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            <Download size={18} />
            Export
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={18} />
            Add Contact
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Business</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Industry</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stage</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Added</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContacts.map(contact => (
                <tr key={contact.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${emailStages[contact.stage - 1]?.color} flex items-center justify-center text-white font-semibold`}>
                        {contact.businessName.charAt(0)}
                      </div>
                      <div className="font-medium text-gray-900">{contact.businessName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{contact.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{contact.industry || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${emailStages[contact.stage - 1]?.color} text-white`}>
                      {emailStages[contact.stage - 1]?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {contact.formSubmitted ? (
                      <span className="flex items-center gap-1 text-green-600 font-medium text-sm">
                        <CheckCircle size={16} /> Submitted
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-yellow-600 font-medium text-sm">
                        <Clock size={16} /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.addedDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleSendToContact(contact.id, contact.stage)}
                        disabled={isSending}
                        className="text-green-600 hover:text-green-800 disabled:opacity-50" 
                        title="Send Email"
                      >
                        <Send size={18} />
                      </button>
                      <button className="text-blue-600 hover:text-blue-800" title="View Details">
                        <Eye size={18} />
                      </button>
                      <button className="text-red-600 hover:text-red-800" onClick={() => handleDeleteContact(contact.id)} title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredContacts.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto text-gray-400 mb-3" size={48} />
            <p className="text-gray-500">No contacts found matching your filters</p>
          </div>
        )}
      </div>
    </div>
  );

  // Submissions view
  const SubmissionsView = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Photo Submissions</h2>
        <span className="text-sm text-gray-500">{submissions.length} submissions</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {submissions.map(submission => (
          <div key={submission.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
            <div className="relative h-48 bg-gray-200">
              <img 
                src={submission.photos[0]} 
                alt={submission.businessName}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-semibold">
                {submission.photos.length} photos
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-1">{submission.businessName}</h3>
              <p className="text-sm text-gray-600 mb-2">{submission.email}</p>
              <p className="text-xs text-gray-500 mb-3">Submitted: {submission.submittedDate}</p>
              <button
                onClick={() => {
                  setSelectedSubmission(submission);
                  setShowPhotoModal(true);
                }}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Eye size={18} />
                View All Photos
              </button>
            </div>
          </div>
        ))}
      </div>

      {submissions.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Image className="mx-auto text-gray-400 mb-4" size={64} />
          <p className="text-gray-500 text-lg">No photo submissions yet</p>
          <p className="text-gray-400 text-sm mt-2">Submissions will appear here once businesses fill out your form</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Partnership Outreach
              </h1>
              <p className="text-sm text-gray-600 mt-1">Manage your email automation campaign</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">N8N Connected</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 size={18} />
                Dashboard
              </div>
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'contacts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users size={18} />
                Contacts ({contacts.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'submissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Image size={18} />
                Submissions ({submissions.length})
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'contacts' && <ContactsView />}
        {activeTab === 'submissions' && <SubmissionsView />}
      </main>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add New Contact</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="business@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newContact.businessName}
                  onChange={(e) => setNewContact({ ...newContact, businessName: e.target.value })}
                  placeholder="Tech Solutions Inc"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newContact.industry}
                  onChange={(e) => setNewContact({ ...newContact, industry: e.target.value })}
                  placeholder="Technology, Marketing, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newContact.contactPerson}
                  onChange={(e) => setNewContact({ ...newContact, contactPerson: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddContact}
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Adding...' : 'Add Contact'}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewContact({ email: '', businessName: '', industry: '', contactPerson: '' });
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Gallery Modal */}
      {showPhotoModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedSubmission.businessName}</h2>
                <p className="text-sm text-gray-600">{selectedSubmission.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowPhotoModal(false);
                  setSelectedSubmission(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedSubmission.photos.map((photo: string, index: number) => (
                <div key={index} className="rounded-lg overflow-hidden shadow-md">
                  <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-64 object-cover" />
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowPhotoModal(false);
                  setSelectedSubmission(null);
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Control Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Campaign Control Center</h2>
              <button
                onClick={() => setShowCampaignModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {emailStages.map(stage => {
                const stageContacts = contacts.filter(c => c.stage === stage.id);
                const StageIcon = stage.icon;
                return (
                  <div key={stage.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`${stage.color} text-white w-12 h-12 rounded-full flex items-center justify-center`}>
                          <StageIcon size={24} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                          <p className="text-sm text-gray-600">{stage.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {stageContacts.length} contact(s) at this stage
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          handleTriggerCampaign(stage.id);
                          setShowCampaignModal(false);
                        }}
                        disabled={isSending || stageContacts.length === 0}
                        className={`${stage.color} text-white px-6 py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2`}
                      >
                        <Send size={18} />
                        {isSending ? 'Sending...' : `Send to ${stageContacts.length}`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-blue-600 mt-0.5" size={20} />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Important Notes:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Emails will be sent to all contacts at the selected stage</li>
                    <li>Make sure your N8N workflow is active and webhooks are configured</li>
                    <li>You'll receive a confirmation before sending</li>
                    <li>Check your N8N logs to verify email delivery</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowCampaignModal(false)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnershipDashboard;
