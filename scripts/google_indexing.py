#!/usr/bin/env python3
"""
Google Indexing API Script
Submets automatiquement tes URLs à Google pour une indexation rapide.

Requirements:
    pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client

Usage:
    python scripts/google_indexing.py
"""

import json
import os
from typing import List
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Configuration
SERVICE_ACCOUNT_FILE = 'service-account-key.json'  # À placer à la racine du projet
SCOPES = ['https://www.googleapis.com/auth/indexing']

# URLs à indexer (par ordre de priorité)
URLS_TO_INDEX = [
    'https://quizzaboom.app/',
    'https://quizzaboom.app/pub-quiz-uk',
    'https://quizzaboom.app/pub-quiz-ireland',
    'https://quizzaboom.app/bar-quiz-night',
    'https://quizzaboom.app/blog',
    'https://quizzaboom.app/blog/how-to-run-successful-pub-quiz-night',
    'https://quizzaboom.app/pricing',
    'https://quizzaboom.app/auth',
    'https://quizzaboom.app/pro-signup',
]


def get_indexing_service():
    """Authentifie et retourne le service Google Indexing API."""
    try:
        credentials = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE, scopes=SCOPES
        )
        service = build('indexing', 'v3', credentials=credentials)
        return service
    except FileNotFoundError:
        print(f"❌ ERREUR: Fichier '{SERVICE_ACCOUNT_FILE}' introuvable.")
        print("   Place le fichier JSON de ton service account à la racine du projet.")
        exit(1)
    except Exception as e:
        print(f"❌ ERREUR d'authentification: {e}")
        exit(1)


def submit_url(service, url: str, action: str = 'URL_UPDATED') -> bool:
    """
    Soumet une URL à Google Indexing API.

    Args:
        service: Service Google Indexing API
        url: URL à indexer
        action: 'URL_UPDATED' (défaut) ou 'URL_DELETED'

    Returns:
        bool: True si succès, False sinon
    """
    try:
        body = {
            'url': url,
            'type': action
        }

        response = service.urlNotifications().publish(body=body).execute()
        print(f"✅ {url}")
        print(f"   └─ Status: {response.get('urlNotificationMetadata', {}).get('latestUpdate', {}).get('type', 'OK')}")
        return True

    except HttpError as e:
        error_details = json.loads(e.content.decode('utf-8'))
        error_message = error_details.get('error', {}).get('message', str(e))

        if e.resp.status == 403:
            print(f"⚠️  {url}")
            print(f"   └─ ERREUR 403: Permissions insuffisantes")
            print(f"   └─ Assure-toi d'avoir ajouté le service account dans Google Search Console")
        elif e.resp.status == 429:
            print(f"⚠️  {url}")
            print(f"   └─ ERREUR 429: Quota dépassé (max 200 URLs/jour)")
        else:
            print(f"❌ {url}")
            print(f"   └─ ERREUR {e.resp.status}: {error_message}")

        return False

    except Exception as e:
        print(f"❌ {url}")
        print(f"   └─ ERREUR: {str(e)}")
        return False


def get_url_status(service, url: str) -> dict:
    """Récupère le statut d'indexation d'une URL."""
    try:
        response = service.urlNotifications().getMetadata(url=url).execute()
        return response
    except HttpError as e:
        if e.resp.status == 404:
            return {'status': 'Jamais soumise'}
        return {'error': str(e)}


def main():
    """Fonction principale."""
    print("=" * 70)
    print("🚀 Google Indexing API - QuizzaBoom")
    print("=" * 70)
    print()

    # Vérification du fichier de service account
    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        print("❌ SETUP REQUIS")
        print()
        print("Le fichier 'service-account-key.json' est manquant.")
        print("Suis le guide dans GOOGLE_INDEXING_API_SETUP.md pour le créer.")
        print()
        return

    # Initialisation du service
    print("🔐 Authentification...")
    service = get_indexing_service()
    print("✅ Authentifié avec succès\n")

    # Soumission des URLs
    print(f"📤 Soumission de {len(URLS_TO_INDEX)} URLs à Google...\n")

    success_count = 0
    failed_count = 0

    for url in URLS_TO_INDEX:
        if submit_url(service, url):
            success_count += 1
        else:
            failed_count += 1
        print()  # Ligne vide entre chaque URL

    # Résumé
    print("=" * 70)
    print("📊 RÉSUMÉ")
    print("=" * 70)
    print(f"✅ Succès: {success_count}/{len(URLS_TO_INDEX)}")
    if failed_count > 0:
        print(f"❌ Échecs: {failed_count}/{len(URLS_TO_INDEX)}")
    print()
    print("⏱️  Délai d'indexation: 24-48h")
    print("📈 Vérifie les résultats dans Google Search Console")
    print()


if __name__ == '__main__':
    main()
