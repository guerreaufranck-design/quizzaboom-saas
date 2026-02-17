# 🚀 Google Indexing API - Guide Setup Complet

Ce guide te permet de soumettre automatiquement tes URLs à Google pour une **indexation rapide** (24-48h au lieu de 1-2 semaines).

---

## ÉTAPE 1 : Créer un projet Google Cloud (5 min)

### 1.1 Accéder à Google Cloud Console

1. Va sur : **https://console.cloud.google.com/**
2. Connecte-toi avec ton compte Google (celui que tu utilises pour Google Search Console)

### 1.2 Créer un nouveau projet

1. Clique sur le **menu déroulant** en haut à gauche (à côté de "Google Cloud")
2. Clique sur **"Nouveau projet"**
3. Nom du projet : `QuizzaBoom Indexing`
4. Clique sur **"Créer"**
5. Attends 10-20 secondes que le projet soit créé
6. **Sélectionne le projet** dans le menu déroulant

✅ **Tu es maintenant dans ton projet QuizzaBoom Indexing**

---

## ÉTAPE 2 : Activer l'API Google Indexing (2 min)

### 2.1 Activer l'API

1. Dans Google Cloud Console, va dans **"APIs & Services" > "Library"**
   - Ou utilise ce lien direct : https://console.cloud.google.com/apis/library

2. Dans la barre de recherche, tape : `Indexing API`

3. Clique sur **"Web Search Indexing API"** ou **"Indexing API"**

4. Clique sur le bouton **"ACTIVER"** (Enable)

5. Attends 5-10 secondes

✅ **L'API est maintenant activée**

---

## ÉTAPE 3 : Créer un Service Account (3 min)

### 3.1 Créer le compte de service

1. Va dans **"APIs & Services" > "Credentials"**
   - Ou utilise ce lien : https://console.cloud.google.com/apis/credentials

2. Clique sur **"+ CREATE CREDENTIALS"** en haut

3. Sélectionne **"Service account"**

4. **Remplis le formulaire :**
   - Service account name : `quizzaboom-indexing`
   - Service account ID : (généré automatiquement)
   - Description : `Service account for QuizzaBoom URL indexing`

5. Clique sur **"CREATE AND CONTINUE"**

6. **Grant this service account access to project** (Étape 2) :
   - Clique sur **"Select a role"**
   - Cherche et sélectionne : **"Owner"**
   - Clique sur **"CONTINUE"**

7. **Grant users access to this service account** (Étape 3) :
   - Laisse vide
   - Clique sur **"DONE"**

✅ **Service account créé !**

### 3.2 Télécharger la clé JSON

1. Dans la liste des **Service Accounts**, clique sur le service account que tu viens de créer :
   - `quizzaboom-indexing@xxx.iam.gserviceaccount.com`

2. Va dans l'onglet **"KEYS"**

3. Clique sur **"ADD KEY" > "Create new key"**

4. Choisis le format **"JSON"**

5. Clique sur **"CREATE"**

6. **Un fichier JSON est téléchargé automatiquement**
   - Nom du fichier : `quizzaboom-indexing-xxxxx.json`

7. **Renomme ce fichier en :** `service-account-key.json`

8. **Place ce fichier à la racine de ton projet QuizzaBoom :**
   ```
   /Users/franckguerreau/quizzaboom/service-account-key.json
   ```

✅ **Clé JSON téléchargée et placée**

---

## ÉTAPE 4 : Ajouter le Service Account dans Google Search Console (2 min)

**IMPORTANT :** Google doit savoir que ce service account a le droit de modifier l'indexation de ton site.

### 4.1 Copier l'email du service account

1. Dans Google Cloud Console, va dans **"IAM & Admin" > "Service Accounts"**
   - Ou : https://console.cloud.google.com/iam-admin/serviceaccounts

2. **Copie l'email du service account** :
   ```
   quizzaboom-indexing@quizzaboom-indexing-xxxxx.iam.gserviceaccount.com
   ```

### 4.2 Ajouter comme propriétaire dans Google Search Console

1. Va sur **Google Search Console** : https://search.google.com/search-console

2. Sélectionne ta propriété : `https://quizzaboom.app`

3. Dans le menu de gauche, clique sur **"Paramètres"** (Settings)

4. Clique sur **"Utilisateurs et autorisations"** (Users and permissions)

5. Clique sur **"AJOUTER UN UTILISATEUR"** (Add user)

6. **Colle l'email du service account** :
   ```
   quizzaboom-indexing@quizzaboom-indexing-xxxxx.iam.gserviceaccount.com
   ```

7. **Sélectionne le niveau d'autorisation :** **"Propriétaire complet"** (Full owner)

8. Clique sur **"AJOUTER"** (Add)

✅ **Service account ajouté comme propriétaire**

---

## ÉTAPE 5 : Installer les dépendances Python (1 min)

### 5.1 Vérifier Python

```bash
python3 --version
```

Si tu n'as pas Python 3.8+, installe-le : https://www.python.org/downloads/

### 5.2 Installer les packages requis

```bash
cd /Users/franckguerreau/quizzaboom
pip3 install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

✅ **Dépendances installées**

---

## ÉTAPE 6 : Lancer le script (10 secondes)

### 6.1 Vérifier que le fichier JSON est à la racine

```bash
ls service-account-key.json
```

Si tu vois le fichier, c'est bon ! ✅

### 6.2 Lancer le script

```bash
python3 scripts/google_indexing.py
```

### 6.3 Résultat attendu

```
======================================================================
🚀 Google Indexing API - QuizzaBoom
======================================================================

🔐 Authentification...
✅ Authentifié avec succès

📤 Soumission de 9 URLs à Google...

✅ https://quizzaboom.app/
   └─ Status: URL_UPDATED

✅ https://quizzaboom.app/pub-quiz-uk
   └─ Status: URL_UPDATED

✅ https://quizzaboom.app/pub-quiz-ireland
   └─ Status: URL_UPDATED

[...]

======================================================================
📊 RÉSUMÉ
======================================================================
✅ Succès: 9/9
⏱️  Délai d'indexation: 24-48h
📈 Vérifie les résultats dans Google Search Console
```

✅ **C'est fait ! Tes URLs sont soumises à Google**

---

## ÉTAPE 7 : Sécuriser le fichier JSON (IMPORTANT)

**Le fichier `service-account-key.json` contient des credentials sensibles.**

### 7.1 Ajouter au .gitignore

```bash
echo "service-account-key.json" >> .gitignore
git add .gitignore
git commit -m "chore: ignore service account key"
git push origin main
```

### 7.2 Vérifier qu'il n'est pas dans le repo

```bash
git status
```

Tu ne dois **PAS** voir `service-account-key.json` dans les fichiers à commiter.

✅ **Fichier sécurisé**

---

## 🔄 Utilisation future

### Ajouter de nouvelles URLs à indexer

1. **Édite le fichier `scripts/google_indexing.py`**

2. **Ajoute tes URLs dans la liste `URLS_TO_INDEX` :**
   ```python
   URLS_TO_INDEX = [
       'https://quizzaboom.app/',
       'https://quizzaboom.app/pub-quiz-uk',
       # ... autres URLs
       'https://quizzaboom.app/nouvelle-page',  # ← Ajoute ici
   ]
   ```

3. **Relance le script :**
   ```bash
   python3 scripts/google_indexing.py
   ```

### Supprimer une URL de Google

Pour supprimer une page de l'index Google :

1. **Modifie le script temporairement :**
   ```python
   submit_url(service, 'https://quizzaboom.app/page-a-supprimer', action='URL_DELETED')
   ```

2. **Lance le script**

3. **Restaure le script ensuite**

---

## 🆘 PROBLÈMES COURANTS

### Erreur 403 : "Permission denied"

**Cause :** Le service account n'est pas ajouté comme propriétaire dans Google Search Console

**Solution :**
1. Vérifie que tu as bien ajouté l'email du service account dans Google Search Console > Paramètres > Utilisateurs
2. Attends 5-10 minutes pour que les permissions se propagent
3. Relance le script

### Erreur 404 : "Not found"

**Cause :** L'API Indexing n'est pas activée

**Solution :**
1. Va sur : https://console.cloud.google.com/apis/library
2. Cherche "Indexing API"
3. Clique sur "ACTIVER"

### Erreur 429 : "Quota exceeded"

**Cause :** Tu as dépassé la limite de 200 URLs/jour

**Solution :**
- Attends 24h
- La limite se réinitialise chaque jour
- C'est une limite Google, pas modifiable

### Erreur : "service-account-key.json not found"

**Cause :** Le fichier JSON n'est pas au bon endroit

**Solution :**
1. Vérifie que le fichier est bien à la racine du projet :
   ```bash
   ls /Users/franckguerreau/quizzaboom/service-account-key.json
   ```
2. Si non, déplace-le :
   ```bash
   mv ~/Downloads/quizzaboom-indexing-xxxxx.json /Users/franckguerreau/quizzaboom/service-account-key.json
   ```

---

## 📊 Monitoring

### Vérifier l'indexation dans Google Search Console

1. Va dans **Google Search Console** > **Couverture**

2. Tu vas voir :
   - **"Valid"** : URLs correctement indexées ✅
   - **"Pending"** : URLs en attente d'indexation ⏳
   - **"Error"** : URLs avec erreur ❌

3. **Délai d'indexation :**
   - **Avec l'API :** 24-48h
   - **Sans l'API :** 1-2 semaines

### Test manuel

Pour tester si une page est indexée, fais une recherche Google :

```
site:quizzaboom.app/pub-quiz-uk
```

Si la page apparaît = indexée ✅

---

## 📞 RESSOURCES

### Documentation officielle
- Google Indexing API : https://developers.google.com/search/apis/indexing-api/v3/quickstart
- Google Cloud Console : https://console.cloud.google.com/

### Limites de l'API
- **200 URLs par jour** (quota par projet)
- **Pas de limite mensuelle**
- **Gratuit** (dans les limites du quota)

### Support
- Email : support@quizzaboom.app
- Google Search Help : https://support.google.com/webmasters/community

---

**Dernière mise à jour :** 2026-02-16

Bonne indexation ! 🚀
