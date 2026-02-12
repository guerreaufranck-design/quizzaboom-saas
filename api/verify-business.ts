import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

interface SireneResult {
  siren: string;
  siret: string;
  denomination: string;
  activitePrincipale: string;
  libelleActivite: string;
  adresse: string;
  codePostal: string;
  ville: string;
  trancheEffectifs: string;
  dateCreation: string;
}

async function lookupSIRENE(siret: string): Promise<SireneResult | null> {
  const cleanSiret = siret.replace(/\s/g, '');

  if (!/^\d{14}$/.test(cleanSiret)) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.insee.fr/entreprises/sirene/V3.11/siret/${cleanSiret}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.INSEE_API_TOKEN}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('INSEE API error:', response.status);
      return null;
    }

    const data = await response.json();
    const etablissement = data.etablissement;
    const uniteLegale = etablissement.uniteLegale;
    const adresse = etablissement.adresseEtablissement;

    return {
      siren: etablissement.siren,
      siret: etablissement.siret,
      denomination:
        uniteLegale.denominationUniteLegale ||
        `${uniteLegale.prenomUsuelUniteLegale || ''} ${uniteLegale.nomUniteLegale || ''}`.trim(),
      activitePrincipale: etablissement.uniteLegale.activitePrincipaleUniteLegale || '',
      libelleActivite: uniteLegale.nomenclatureActivitePrincipaleUniteLegale || 'NAFRev2',
      adresse: `${adresse.numeroVoieEtablissement || ''} ${adresse.typeVoieEtablissement || ''} ${adresse.libelleVoieEtablissement || ''}`.trim(),
      codePostal: adresse.codePostalEtablissement || '',
      ville: adresse.libelleCommuneEtablissement || '',
      trancheEffectifs: etablissement.trancheEffectifsEtablissement || '',
      dateCreation: etablissement.dateCreationEtablissement || '',
    };
  } catch (error) {
    console.error('SIRENE lookup error:', error);
    return null;
  }
}

async function lookupVIES(vatNumber: string): Promise<{ valid: boolean; name: string; address: string; countryCode: string } | null> {
  const cleanVat = vatNumber.replace(/\s/g, '').toUpperCase();
  const countryCode = cleanVat.substring(0, 2);
  const number = cleanVat.substring(2);

  if (!/^[A-Z]{2}/.test(cleanVat) || number.length < 4) {
    return null;
  }

  try {
    const response = await fetch('https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countryCode, vatNumber: number }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      valid: data.valid === true,
      name: data.name || '',
      address: data.address || '',
      countryCode,
    };
  } catch (error) {
    console.error('VIES lookup error:', error);
    return null;
  }
}

async function checkEligibilityWithAI(businessInfo: {
  name: string;
  activityCode: string;
  activityLabel: string;
  address: string;
  country: string;
}): Promise<{ eligible: boolean; reason: string; detectedType: string }> {
  if (!genAI) {
    return { eligible: false, reason: 'AI verification unavailable', detectedType: 'unknown' };
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are a business eligibility checker for QuizzaBoom, a quiz entertainment platform for hospitality and events.

Analyze this business and determine if it is ELIGIBLE for our B2B platform.

**Business Information:**
- Name: ${businessInfo.name}
- Activity Code (NAF/NACE): ${businessInfo.activityCode}
- Activity Description: ${businessInfo.activityLabel}
- Address: ${businessInfo.address}
- Country: ${businessInfo.country}

**ELIGIBLE business types (entertainment, hospitality, events):**
- Restaurants, brasseries, bistros, cafes
- Bars, pubs, wine bars, cocktail bars
- Hotels, hostels, B&Bs, guesthouses, resorts
- Event companies, wedding planners, party organizers
- Discotheques, nightclubs, karaoke bars
- Bowling alleys, escape rooms, amusement parks
- Museums, cultural centers, theaters
- Campings, holiday parks, leisure centers
- Catering companies, traiteurs
- Team building companies, corporate event organizers
- Tourism offices, activity centers
- Concert halls, live music venues

**NOT ELIGIBLE (unrelated industries):**
- Construction, plumbing, carpentry, electricians
- Law firms, accounting, consulting (unless event consulting)
- Medical, pharmaceutical, healthcare
- Agriculture, farming
- Manufacturing, industrial
- Retail shops (unless entertainment-focused)
- IT services, software companies
- Real estate, insurance, banking

Respond ONLY with this JSON format:
{
  "eligible": true/false,
  "reason": "Brief explanation in English",
  "detectedType": "bar" | "restaurant" | "hotel" | "event_company" | "entertainment" | "other"
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { eligible: false, reason: 'Could not parse AI response', detectedType: 'unknown' };
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('AI eligibility check error:', error);
    return { eligible: false, reason: 'AI verification failed', detectedType: 'unknown' };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, req.headers.origin);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { registrationNumber, country, userId, businessName } = req.body;

  if (!registrationNumber || !country || !userId) {
    return res.status(400).json({ error: 'Missing required fields: registrationNumber, country, userId' });
  }

  try {
    // Step 1: Look up business in official registry
    let businessInfo: {
      name: string;
      activityCode: string;
      activityLabel: string;
      address: string;
      country: string;
    } | null = null;

    const NON_EU_COUNTRIES = ['US', 'AU', 'NZ', 'GB'];

    if (country === 'FR') {
      const sireneResult = await lookupSIRENE(registrationNumber);
      if (!sireneResult) {
        return res.status(404).json({
          error: 'Business not found',
          message: 'The SIRET number was not found in the French business registry. Please check and try again.',
        });
      }
      businessInfo = {
        name: sireneResult.denomination,
        activityCode: sireneResult.activitePrincipale,
        activityLabel: sireneResult.libelleActivite,
        address: `${sireneResult.adresse}, ${sireneResult.codePostal} ${sireneResult.ville}`,
        country: 'France',
      };
    } else if (NON_EU_COUNTRIES.includes(country)) {
      // Non-EU countries: no VIES, rely on business name + AI verification
      if (!businessName || !businessName.trim()) {
        return res.status(400).json({
          error: 'Business name required',
          message: 'Please provide your business name for verification.',
        });
      }

      const countryNames: Record<string, string> = {
        US: 'United States',
        AU: 'Australia',
        NZ: 'New Zealand',
        GB: 'United Kingdom',
      };

      businessInfo = {
        name: businessName.trim(),
        activityCode: '',
        activityLabel: businessName.trim(),
        address: '',
        country: countryNames[country] || country,
      };
    } else {
      // EU VAT verification via VIES
      const viesResult = await lookupVIES(registrationNumber);
      if (viesResult && viesResult.valid) {
        // VIES validated — use VIES data
        businessInfo = {
          name: viesResult.name || businessName || 'Unknown',
          activityCode: '',
          activityLabel: businessName || viesResult.name || '',
          address: viesResult.address || '',
          country: viesResult.countryCode,
        };
      } else {
        // VIES failed or invalid — fallback to business name + AI verification
        if (!businessName || !businessName.trim()) {
          return res.status(400).json({
            error: 'Verification failed',
            message: 'VAT verification unavailable for this country. Please provide your business name.',
          });
        }
        businessInfo = {
          name: businessName.trim(),
          activityCode: '',
          activityLabel: businessName.trim(),
          address: '',
          country,
        };
      }
    }

    // Step 2: AI eligibility check
    const eligibility = await checkEligibilityWithAI(businessInfo);

    if (!eligibility.eligible) {
      // Save the rejected verification request
      await supabase.from('verification_requests').insert({
        user_id: userId,
        registration_number: registrationNumber,
        country,
        business_name: businessInfo.name,
        activity_code: businessInfo.activityCode,
        status: 'rejected',
        rejection_reason: eligibility.reason,
        detected_type: eligibility.detectedType,
        raw_data: businessInfo,
      });

      return res.status(200).json({
        eligible: false,
        businessName: businessInfo.name,
        reason: eligibility.reason,
        detectedType: eligibility.detectedType,
      });
    }

    // Step 3: Create organization + activate trial
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    const orgType = (['bar', 'restaurant', 'hotel', 'event_company'].includes(eligibility.detectedType))
      ? eligibility.detectedType as 'bar' | 'restaurant' | 'hotel' | 'event_company'
      : 'other';

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: businessInfo.name,
        type: orgType,
        subscription_plan: 'starter',
        subscription_status: 'trial',
        trial_ends_at: trialEndsAt.toISOString(),
        monthly_quiz_limit: 5,
        quizzes_used_this_month: 0,
        max_participants: 250,
        white_label_enabled: false,
      })
      .select()
      .single();

    if (orgError) {
      console.error('Organization creation error:', orgError);
      return res.status(500).json({ error: 'Failed to create organization' });
    }

    // Step 4: Add user as organization owner
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: userId,
        role: 'owner',
        joined_at: new Date().toISOString(),
      });

    if (memberError) {
      console.error('Member creation error:', memberError);
      // Clean up orphaned organization
      await supabase.from('organizations').delete().eq('id', org.id);
      return res.status(500).json({
        error: 'Failed to link account',
        message: 'Failed to link your account to the organization. Please try again.',
      });
    }

    // Step 5: Save successful verification
    await supabase.from('verification_requests').insert({
      user_id: userId,
      registration_number: registrationNumber,
      country,
      business_name: businessInfo.name,
      activity_code: businessInfo.activityCode,
      status: 'approved',
      detected_type: eligibility.detectedType,
      organization_id: org.id,
      raw_data: businessInfo,
    });

    return res.status(200).json({
      eligible: true,
      businessName: businessInfo.name,
      detectedType: eligibility.detectedType,
      organizationId: org.id,
      trialEndsAt: trialEndsAt.toISOString(),
    });

  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ error: 'Verification service error' });
  }
}
