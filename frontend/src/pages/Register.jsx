import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Brain, User, Mail, Lock, Phone, UserPlus, Loader2, Plus, Trash2 } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    emergency_contacts: []
  });
  const [loading, setLoading] = useState(false);
  const [showContacts, setShowContacts] = useState(false);

  const addEmergencyContact = () => {
    setFormData({
      ...formData,
      emergency_contacts: [
        ...formData.emergency_contacts,
        { name: '', relationship: 'parent', email: '', phone: '' }
      ]
    });
    setShowContacts(true);
  };

  const removeEmergencyContact = (index) => {
    const newContacts = formData.emergency_contacts.filter((_, i) => i !== index);
    setFormData({ ...formData, emergency_contacts: newContacts });
  };

  const updateEmergencyContact = (index, field, value) => {
    const newContacts = [...formData.emergency_contacts];
    newContacts[index][field] = value;
    setFormData({ ...formData, emergency_contacts: newContacts });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        age: formData.age ? parseInt(formData.age) : null,
        emergency_contacts: formData.emergency_contacts
      };

      await register(userData);
      toast.success('Welcome to Buddy Mind Flow! 🎉');
      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl" data-testid="register-card">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-4 rounded-2xl">
              <Brain className="w-12 h-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Join Buddy Mind Flow</CardTitle>
          <CardDescription>Start your mental wellness journey today</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10"
                    required
                    data-testid="name-input"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="age">Age (Optional)</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Your age"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  min="5"
                  max="100"
                  data-testid="age-input"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  required
                  data-testid="email-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10"
                    required
                    minLength={6}
                    data-testid="password-input"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pl-10"
                    required
                    minLength={6}
                    data-testid="confirm-password-input"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contacts Section */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <Label className="text-base">Emergency Contacts (Optional)</Label>
                <Button
                  type="button"
                  onClick={addEmergencyContact}
                  variant="outline"
                  size="sm"
                  data-testid="add-contact-button"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Contact
                </Button>
              </div>
              
              {formData.emergency_contacts.length > 0 && (
                <div className="space-y-4">
                  {formData.emergency_contacts.map((contact, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium">Contact {index + 1}</h4>
                        <Button
                          type="button"
                          onClick={() => removeEmergencyContact(index)}
                          variant="ghost"
                          size="sm"
                          data-testid={`remove-contact-${index}`}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          placeholder="Contact name"
                          value={contact.name}
                          onChange={(e) => updateEmergencyContact(index, 'name', e.target.value)}
                          data-testid={`contact-name-${index}`}
                        />
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={contact.relationship}
                          onChange={(e) => updateEmergencyContact(index, 'relationship', e.target.value)}
                          data-testid={`contact-relationship-${index}`}
                        >
                          <option value="parent">Parent</option>
                          <option value="guardian">Guardian</option>
                          <option value="teacher">Teacher</option>
                          <option value="counselor">Counselor</option>
                        </select>
                        <Input
                          type="email"
                          placeholder="Email"
                          value={contact.email}
                          onChange={(e) => updateEmergencyContact(index, 'email', e.target.value)}
                          data-testid={`contact-email-${index}`}
                        />
                        <Input
                          type="tel"
                          placeholder="Phone number"
                          value={contact.phone}
                          onChange={(e) => updateEmergencyContact(index, 'phone', e.target.value)}
                          data-testid={`contact-phone-${index}`}
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              disabled={loading}
              size="lg"
              data-testid="register-button"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
                Login here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;