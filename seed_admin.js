import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    const adminUsername = 'admin';
    const adminPassword = 'adminpassword123';

    console.log('Checking for admin user...');

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', adminUsername)
      .single();

    if (existingUser) {
        console.log('Admin user already exists!');
        return;
    }

    console.log('Creating admin user...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
            nama: 'Administrator',
            username: adminUsername,
            password: hashedPassword,
            role: 'admin'
        }
      ])
      .select();

    if (error) {
        console.error('Error creating admin:', error);
    } else {
        console.log('Admin created successfully!', data);
    }
}

seed();
