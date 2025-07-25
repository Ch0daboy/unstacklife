@@ .. @@
 import React, { useState } from 'react';
 import { User, Lock, Mail, LogIn, UserPlus } from 'lucide-react';
-import { login, register } from '../lib/auth';
+import { supabase } from '../lib/supabase';

@@ .. @@
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);
     setError('');

     try {
       if (isLogin) {
-        const user = await login(email, password);
-        onLogin(user);
+        const { data, error } = await supabase.auth.signInWithPassword({
+          email,
+          password,
+        });
+        
+        if (error) throw error;
+        if (data.user) {
+          onLogin({ id: data.user.id, email: data.user.email || '' });
+        }
       } else {
-        const user = await register(email, password);
-        onLogin(user);
+        const { data, error } = await supabase.auth.signUp({
+          email,
+          password,
+        });
+        
+        if (error) throw error;
+        if (data.user) {
+          onLogin({ id: data.user.id, email: data.user.email || '' });
+        }
       }
     } catch (error: any) {
       setError(error.message || 'Authentication failed');
     } finally {
       setLoading(false);
     }
   };