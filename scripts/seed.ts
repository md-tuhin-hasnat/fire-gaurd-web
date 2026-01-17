/**
 * Database Seeder Script
 * Populates the database with initial test data:
 * - Super admin account
 * - 100 pre-generated device IDs with activation keys
 * - 5 sample companies
 * - 10 fire stations
 * - 20 traffic police stations
 * 
 * Run with: npm run seed
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import connectDB from '../lib/db';
import User from '../models/User';
import Company from '../models/Company';
import Device from '../models/Device';
import FireStation from '../models/FireStation';
import TrafficPolice from '../models/TrafficPolice';
import SensorData from '../models/SensorData';
import Alert from '../models/Alert';
import DeviceWarning from '../models/DeviceWarning';

/**
 * Generate a random device ID
 * Format: FG-XXXXXX (FG = Fire Guard, X = alphanumeric)
 */
function generateDeviceId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'FG-';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * Generate a random activation key
 * Format: 16 character alphanumeric string
 */
function generateActivationKey(): string {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
}

/**
 * Generate random coordinates within Bangladesh bounds
 */
function generateBangladeshCoordinates(): [number, number] {
  // Bangladesh approximate bounds
  const minLng = 88.0;
  const maxLng = 92.7;
  const minLat = 20.5;
  const maxLat = 26.6;
  
  const lng = minLng + Math.random() * (maxLng - minLng);
  const lat = minLat + Math.random() * (maxLat - minLat);
  
  return [lng, lat];
}

/**
 * Generate Dhaka city coordinates (more focused area)
 */
function generateDhakaCoordinates(): [number, number] {
  // Dhaka approximate bounds
  const minLng = 90.35;
  const maxLng = 90.45;
  const minLat = 23.70;
  const maxLat = 23.85;
  
  const lng = minLng + Math.random() * (maxLng - minLng);
  const lat = minLat + Math.random() * (maxLat - minLat);
  
  return [lng, lat];
}

async function seed() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Connect to database
    await connectDB();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Company.deleteMany({});
    await Device.deleteMany({});
    await FireStation.deleteMany({});
    await TrafficPolice.deleteMany({});
    await SensorData.deleteMany({});
    await Alert.deleteMany({});
    await DeviceWarning.deleteMany({});
    console.log('✅ Existing data cleared\n');

    // 1. Create Super Admin
    console.log('👤 Creating super admin...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const superAdmin = await User.create({
      email: 'admin@fireguard.com',
      password: hashedPassword,
      name: 'System Administrator',
      role: 'super_admin',
      isActive: true,
    });
    console.log(`✅ Super admin created: ${superAdmin.email} / admin123\n`);

    // 2. Generate 100 Device IDs with activation keys
    console.log('🔧 Generating 100 device IDs...');
    const deviceIds = new Set<string>();
    const devices = [];

    while (deviceIds.size < 100) {
      const deviceId = generateDeviceId();
      if (!deviceIds.has(deviceId)) {
        deviceIds.add(deviceId);
        const activationKey = generateActivationKey();
        const activationKeyHash = await bcrypt.hash(activationKey, 10);
        
        devices.push({
          deviceId,
          activationKey, // Store plain key for CSV export
          activationKeyHash,
        });
      }
    }

    // Save devices to database (not registered yet)
    const deviceDocs = await Device.insertMany(
      devices.map((d) => ({
        deviceId: d.deviceId,
        activationKeyHash: d.activationKeyHash,
        isRegistered: false,
        status: 'inactive',
      }))
    );
    console.log(`✅ Created 100 devices in database\n`);

    // Export device credentials to console
    console.log('📋 Device Credentials (Save these for device registration):');
    console.log('='.repeat(60));
    console.log('Device ID\t\tActivation Key');
    console.log('='.repeat(60));
    devices.slice(0, 10).forEach((d) => {
      console.log(`${d.deviceId}\t\t${d.activationKey}`);
    });
    console.log(`... and ${devices.length - 10} more devices`);
    console.log('='.repeat(60));
    console.log('');

    // 3. Create 5 Sample Companies
    console.log('🏢 Creating sample companies...');
    const companies = await Company.insertMany([
      {
        name: 'Apex Garments Ltd',
        companyType: 'garments',
        location: {
          type: 'Point',
          coordinates: [90.4125, 23.8103],
          address: 'Mirpur DOHS, Dhaka',
        },
        contactEmail: 'contact@apexgarments.com',
        contactPhone: '+880-1711-123456',
        address: 'House 12, Road 5, Mirpur DOHS',
        city: 'Dhaka',
        country: 'Bangladesh',
        devices: [],
        isActive: true,
      },
      {
        name: 'Bengal Oil & Gas Corporation',
        companyType: 'oil_gas',
        location: {
          type: 'Point',
          coordinates: [91.8326, 22.3569],
          address: 'Chittagong Port Area',
        },
        contactEmail: 'info@bengaloil.com',
        contactPhone: '+880-1811-234567',
        address: 'Port Road, Chittagong',
        city: 'Chittagong',
        country: 'Bangladesh',
        devices: [],
        isActive: true,
      },
      {
        name: 'City Hospital Dhaka',
        companyType: 'hospital',
        location: {
          type: 'Point',
          coordinates: [90.3938, 23.7805],
          address: 'Dhanmondi, Dhaka',
        },
        contactEmail: 'admin@cityhospital.com',
        contactPhone: '+880-1911-345678',
        address: '45 Satmasjid Road, Dhanmondi',
        city: 'Dhaka',
        country: 'Bangladesh',
        devices: [],
        isActive: true,
      },
      {
        name: 'National Warehouse Services',
        companyType: 'warehouse',
        location: {
          type: 'Point',
          coordinates: [90.4230, 23.7925],
          address: 'Tejgaon Industrial Area',
        },
        contactEmail: 'ops@nationalwarehouse.com',
        contactPhone: '+880-1611-456789',
        address: 'Plot 23, Tejgaon I/A',
        city: 'Dhaka',
        country: 'Bangladesh',
        devices: [],
        isActive: true,
      },
      {
        name: 'Sunrise Manufacturing Ltd',
        companyType: 'manufacturing',
        location: {
          type: 'Point',
          coordinates: [90.3900, 23.8500],
          address: 'Uttara Sector 7',
        },
        contactEmail: 'factory@sunrisemfg.com',
        contactPhone: '+880-1511-567890',
        address: 'Sector 7, Uttara',
        city: 'Dhaka',
        country: 'Bangladesh',
        devices: [],
        isActive: true,
      },
    ]);
    console.log(`✅ Created ${companies.length} companies\n`);

    // 4. Create 10 Fire Stations in Dhaka
    console.log('🚒 Creating fire stations...');
    const fireStations = await FireStation.insertMany([
      {
        name: 'Mirpur Fire Station',
        stationCode: 'FS-MIR-01',
        location: { type: 'Point', coordinates: [90.3667, 23.8223] },
        coverageRadius: 5,
        contactPhone: '+880-2-9006666',
        contactEmail: 'mirpur@fireservice.gov.bd',
        address: 'Mirpur-10, Dhaka',
        city: 'Dhaka',
        availableVehicles: 3,
        isActive: true,
      },
      {
        name: 'Mohakhali Fire Station',
        stationCode: 'FS-MKL-01',
        location: { type: 'Point', coordinates: [90.3938, 23.7805] },
        coverageRadius: 6,
        contactPhone: '+880-2-9007777',
        contactEmail: 'mohakhali@fireservice.gov.bd',
        address: 'Mohakhali, Dhaka',
        city: 'Dhaka',
        availableVehicles: 4,
        isActive: true,
      },
      {
        name: 'Dhanmondi Fire Station',
        stationCode: 'FS-DHN-01',
        location: { type: 'Point', coordinates: [90.3742, 23.7461] },
        coverageRadius: 5,
        contactPhone: '+880-2-9008888',
        contactEmail: 'dhanmondi@fireservice.gov.bd',
        address: 'Road 27, Dhanmondi',
        city: 'Dhaka',
        availableVehicles: 3,
        isActive: true,
      },
      {
        name: 'Gulshan Fire Station',
        stationCode: 'FS-GUL-01',
        location: { type: 'Point', coordinates: [90.4125, 23.7808] },
        coverageRadius: 7,
        contactPhone: '+880-2-9009999',
        contactEmail: 'gulshan@fireservice.gov.bd',
        address: 'Gulshan Avenue',
        city: 'Dhaka',
        availableVehicles: 5,
        isActive: true,
      },
      {
        name: 'Uttara Fire Station',
        stationCode: 'FS-UTR-01',
        location: { type: 'Point', coordinates: [90.3897, 23.8742] },
        coverageRadius: 8,
        contactPhone: '+880-2-9001111',
        contactEmail: 'uttara@fireservice.gov.bd',
        address: 'Sector 4, Uttara',
        city: 'Dhaka',
        availableVehicles: 4,
        isActive: true,
      },
      {
        name: 'Tejgaon Fire Station',
        stationCode: 'FS-TEJ-01',
        location: { type: 'Point', coordinates: [90.4070, 23.7639] },
        coverageRadius: 6,
        contactPhone: '+880-2-9002222',
        contactEmail: 'tejgaon@fireservice.gov.bd',
        address: 'Tejgaon I/A',
        city: 'Dhaka',
        availableVehicles: 3,
        isActive: true,
      },
      {
        name: 'Motijheel Fire Station',
        stationCode: 'FS-MTJ-01',
        location: { type: 'Point', coordinates: [90.4177, 23.7333] },
        coverageRadius: 5,
        contactPhone: '+880-2-9003333',
        contactEmail: 'motijheel@fireservice.gov.bd',
        address: 'Motijheel C/A',
        city: 'Dhaka',
        availableVehicles: 4,
        isActive: true,
      },
      {
        name: 'Banani Fire Station',
        stationCode: 'FS-BAN-01',
        location: { type: 'Point', coordinates: [90.4043, 23.7937] },
        coverageRadius: 5,
        contactPhone: '+880-2-9004444',
        contactEmail: 'banani@fireservice.gov.bd',
        address: 'Road 11, Banani',
        city: 'Dhaka',
        availableVehicles: 3,
        isActive: true,
      },
      {
        name: 'Khilgaon Fire Station',
        stationCode: 'FS-KHL-01',
        location: { type: 'Point', coordinates: [90.4284, 23.7525] },
        coverageRadius: 6,
        contactPhone: '+880-2-9005555',
        contactEmail: 'khilgaon@fireservice.gov.bd',
        address: 'Khilgaon, Dhaka',
        city: 'Dhaka',
        availableVehicles: 2,
        isActive: true,
      },
      {
        name: 'Savar Fire Station',
        stationCode: 'FS-SAV-01',
        location: { type: 'Point', coordinates: [90.2667, 23.8583] },
        coverageRadius: 10,
        contactPhone: '+880-2-9006600',
        contactEmail: 'savar@fireservice.gov.bd',
        address: 'Savar Upazila',
        city: 'Dhaka',
        availableVehicles: 3,
        isActive: true,
      },
    ]);
    console.log(`✅ Created ${fireStations.length} fire stations\n`);

    // 5. Create Fire Service User Accounts
    console.log('👨‍🚒 Creating fire service users...');
    const fireServiceUsers = [];
    for (let i = 0; i < fireStations.length; i++) {
      const station = fireStations[i];
      const email = `${station.stationCode.toLowerCase()}@fireservice.gov.bd`;
      const password = await bcrypt.hash('fire123', 10);
      
      const user = await User.create({
        email,
        password,
        name: `${station.name} Officer`,
        role: 'fire_service',
        fireStationId: station._id,
        isActive: true,
      });
      fireServiceUsers.push(user);
    }
    console.log(`✅ Created ${fireServiceUsers.length} fire service users\n`);

    // 6. Create 20 Traffic Police Stations
    console.log('🚓 Creating traffic police stations...');
    const trafficPoliceStations = await TrafficPolice.insertMany([
      {
        stationName: 'Mirpur Traffic Zone',
        stationCode: 'TP-MIR-01',
        contactPhone: '+880-2-8001111',
        location: { type: 'Point', coordinates: [90.3750, 23.8200] },
        jurisdiction: { type: 'Point', coordinates: [90.3750, 23.8200] },
        coverageArea: 'Mirpur 1 to Mirpur 14',
        city: 'Dhaka',
        isActive: true,
      },
      {
        stationName: 'Gulshan Traffic Zone',
        stationCode: 'TP-GUL-01',
        contactPhone: '+880-2-8002222',
        location: { type: 'Point', coordinates: [90.4150, 23.7800] },
        jurisdiction: { type: 'Point', coordinates: [90.4150, 23.7800] },
        coverageArea: 'Gulshan 1 & 2, Banani',
        city: 'Dhaka',
        isActive: true,
      },
      {
        stationName: 'Dhanmondi Traffic Zone',
        stationCode: 'TP-DHN-01',
        contactPhone: '+880-2-8003333',
        location: { type: 'Point', coordinates: [90.3750, 23.7450] },
        jurisdiction: { type: 'Point', coordinates: [90.3750, 23.7450] },
        coverageArea: 'Dhanmondi, Lalmatia',
        city: 'Dhaka',
        isActive: true,
      },
      {
        stationName: 'Mohakhali Traffic Zone',
        stationCode: 'TP-MKL-01',
        contactPhone: '+880-2-8004444',
        location: { type: 'Point', coordinates: [90.3950, 23.7820] },
        jurisdiction: { type: 'Point', coordinates: [90.3950, 23.7820] },
        coverageArea: 'Mohakhali, Banani, Wireless',
        city: 'Dhaka',
        isActive: true,
      },
      {
        stationName: 'Uttara Traffic Zone',
        stationCode: 'TP-UTR-01',
        contactPhone: '+880-2-8005555',
        location: { type: 'Point', coordinates: [90.3900, 23.8750] },
        jurisdiction: { type: 'Point', coordinates: [90.3900, 23.8750] },
        coverageArea: 'Uttara Sector 1-18',
        city: 'Dhaka',
        isActive: true,
      },
      {
        stationName: 'Airport Traffic Zone',
        stationCode: 'TP-AIR-01',
        contactPhone: '+880-2-8006666',
        location: { type: 'Point', coordinates: [90.4000, 23.8470] },
        jurisdiction: { type: 'Point', coordinates: [90.4000, 23.8470] },
        coverageArea: 'Airport Road, Kawla',
        city: 'Dhaka',
        isActive: true,
      },
      {
        stationName: 'Farmgate Traffic Zone',
        stationCode: 'TP-FAR-01',
        contactPhone: '+880-2-8007777',
        location: { type: 'Point', coordinates: [90.3878, 23.7580] },
        jurisdiction: { type: 'Point', coordinates: [90.3878, 23.7580] },
        coverageArea: 'Farmgate, Kawran Bazar',
        city: 'Dhaka',
        isActive: true,
      },
      {
        stationName: 'Tejgaon Traffic Zone',
        stationCode: 'TP-TEJ-01',
        contactPhone: '+880-2-8008888',
        location: { type: 'Point', coordinates: [90.4070, 23.7640] },
        jurisdiction: { type: 'Point', coordinates: [90.4070, 23.7640] },
        coverageArea: 'Tejgaon I/A, Satrasta',
        city: 'Dhaka',
        isActive: true,
      },
      {
        stationName: 'Motijheel Traffic Zone',
        stationCode: 'TP-MTJ-01',
        contactPhone: '+880-2-8009999',
        location: { type: 'Point', coordinates: [90.4180, 23.7330] },
        jurisdiction: { type: 'Point', coordinates: [90.4180, 23.7330] },
        coverageArea: 'Motijheel, Paltan',
        city: 'Dhaka',
        isActive: true,
      },
      {
        stationName: 'Shahbagh Traffic Zone',
        stationCode: 'TP-SHA-01',
        contactPhone: '+880-2-8001100',
        location: { type: 'Point', coordinates: [90.3984, 23.7385] },
        jurisdiction: { type: 'Point', coordinates: [90.3984, 23.7385] },
        coverageArea: 'Shahbagh, DU Area',
        city: 'Dhaka',
        isActive: true,
      },
      {
        stationName: 'Khilgaon Traffic Zone',
        stationCode: 'TP-KHL-01',
        contactPhone: '+880-2-8002200',
        location: { type: 'Point', coordinates: [90.4280, 23.7520] },
        jurisdiction: { type: 'Point', coordinates: [90.4280, 23.7520] },
        coverageArea: 'Khilgaon, Rampura',
        city: 'Dhaka',
        isActive: true,
      },
      {
        stationName: 'Badda Traffic Zone',
        stationCode: 'TP-BAD-01',
        contactPhone: '+880-2-8003300',
        location: { type: 'Point', coordinates: [90.4254, 23.7800] },
        jurisdiction: { type: 'Point', coordinates: [90.4254, 23.7800] },
        coverageArea: 'Badda, Natun Bazar',
        city: 'Dhaka',
        isActive: true,
      },
      {
        stationName: 'Shyamoli Traffic Zone',
        stationCode: 'TP-SHY-01',
        contactPhone: '+880-2-8004400',
        location: { type: 'Point', coordinates: [90.3680, 23.7690] },
        jurisdiction: { type: 'Point', coordinates: [90.3680, 23.7690] },
        coverageArea: 'Shyamoli, Mohammadpur',
        city: 'Dhaka',
        isActive: true,
      },
      {
        stationName: 'Ashulia Traffic Zone',
        stationCode: 'TP-ASH-01',
        contactPhone: '+880-2-8005500',
        location: { type: 'Point', coordinates: [90.2500, 23.8800] },
        jurisdiction: { type: 'Point', coordinates: [90.2500, 23.8800] },
        coverageArea: 'Ashulia, EPZ',
        city: 'Dhaka',
        isActive: true,
      },
      {
        stationName: 'Jatrabari Traffic Zone',
        stationCode: 'TP-JAT-01',
        contactPhone: '+880-2-8006600',
        location: { type: 'Point', coordinates: [90.4330, 23.7100] },
        jurisdiction: { type: 'Point', coordinates: [90.4330, 23.7100] },
        coverageArea: 'Jatrabari, Sayedabad',
        city: 'Dhaka',
        isActive: true,
      },
      {
        stationName: 'Gazipur Traffic Zone',
        stationCode: 'TP-GAZ-01',
        contactPhone: '+880-2-8007700',
        location: { type: 'Point', coordinates: [90.4125, 23.9975] },
        jurisdiction: { type: 'Point', coordinates: [90.4125, 23.9975] },
        coverageArea: 'Gazipur, Tongi',
        city: 'Gazipur',
        isActive: true,
      },
      {
        stationName: 'Demra Traffic Zone',
        stationCode: 'TP-DEM-01',
        contactPhone: '+880-2-8008800',
        location: { type: 'Point', coordinates: [90.5000, 23.7200] },
        jurisdiction: { type: 'Point', coordinates: [90.5000, 23.7200] },
        coverageArea: 'Demra, Postogola',
        city: 'Dhaka',
        isActive: true,
      },
      {
        stationName: 'Keraniganj Traffic Zone',
        stationCode: 'TP-KER-01',
        contactPhone: '+880-2-8009900',
        location: { type: 'Point', coordinates: [90.3700, 23.7000] },
        jurisdiction: { type: 'Point', coordinates: [90.3700, 23.7000] },
        coverageArea: 'Keraniganj, Nawabganj',
        city: 'Dhaka',
        isActive: true,
      },
      {
        stationName: 'Banasree Traffic Zone',
        stationCode: 'TP-BAN-01',
        contactPhone: '+880-2-8001010',
        location: { type: 'Point', coordinates: [90.4400, 23.7650] },
        jurisdiction: { type: 'Point', coordinates: [90.4400, 23.7650] },
        coverageArea: 'Banasree, Aftabnagar',
        city: 'Dhaka',
        isActive: true,
      },
      {
        stationName: 'Cantonment Traffic Zone',
        stationCode: 'TP-CAN-01',
        contactPhone: '+880-2-8002020',
        location: { type: 'Point', coordinates: [90.4200, 23.8000] },
        jurisdiction: { type: 'Point', coordinates: [90.4200, 23.8000] },
        coverageArea: 'Cantonment Area',
        city: 'Dhaka',
        isActive: true,
      },
    ]);
    console.log(`✅ Created ${trafficPoliceStations.length} traffic police stations\n`);

    console.log('✅ Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Super Admin: 1`);
    console.log(`   - Devices: ${deviceDocs.length}`);
    console.log(`   - Companies: ${companies.length}`);
    console.log(`   - Fire Stations: ${fireStations.length}`);
    console.log(`   - Fire Service Users: ${fireServiceUsers.length}`);
    console.log(`   - Traffic Police: ${trafficPoliceStations.length}`);
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log('   Super Admin:');
    console.log('     Email: admin@fireguard.com');
    console.log('     Password: admin123');
    console.log('');
    console.log('   Fire Service (any station):');
    console.log('     Email: fs-mir-01@fireservice.gov.bd (or any station code)');
    console.log('     Password: fire123');
    console.log('');
    console.log('💡 Next Steps:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Access the application at http://localhost:3000');
    console.log('   3. Login as super admin to manage the system');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeder
seed();
