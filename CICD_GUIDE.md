# CI/CD Setup Guide for Movie Review & Finder

This project comes equipped with an automated **CI/CD Pipeline** using **GitHub Actions** and **Docker** to deploy your full-stack application directly to **Google Cloud Run**.

Below is a step-by-step guide to configure your Google Cloud Platform (GCP) credentials and link them to your GitHub repository.

---

## 🛠️ Step 1: Prepare Google Cloud Platform

### 1. Enable Required APIs
Ensure the following APIs are enabled in your Google Cloud Project:
- **Artifact Registry API** (to store Docker container images)
- **Cloud Run API** (to run your serverless containers)
- **Cloud Build API** (optional, useful for system execution diagnostics)

You can enable them in the GCP Console search bar or by running the following Google Cloud CLI command:
```bash
gcloud services enable artifactregistry.googleapis.com run.googleapis.com
```

### 2. Create an Artifact Registry Repository
Create a repository inside Google Artifact Registry to store your built Docker images:
1. Navigate to **Artifact Registry** in the GCP Console.
2. Click **+ Create Repository**.
3. Configure the following:
   - **Name**: `app-images` *(or any preferred name)*
   - **Format**: `Docker`
   - **Location Type**: `Region` (e.g., `us-central1` or `europe-west2`)
4. Click **Create**.

### 3. Create a Service Account for Deployment
Create a Service Account that GitHub Actions can use to authenticate and deploy resources:
1. Navigate to **IAM & Admin** > **Service Accounts** in GCP.
2. Click **+ Create Service Account**.
3. Name it `github-deployer` and click **Create and Continue**.
4. Grant the following IAM Roles:
   - **Artifact Registry Writer** (to push built images)
   - **Cloud Run Developer** (to deploy new revisions)
   - **Service Account User** (required for deploying to Cloud Run)
5. Click **Done**.

### 4. Generate authentication keys (Simple Approach)
1. Inside your new Service Account details page, navigate to the **Keys** tab.
2. Click **Add Key** > **Create New Key**.
3. Choose **JSON** as the key type and click **Create**.
4. Save the downloaded JSON file securely. You will paste this key into your GitHub repository secrets.

---

## 🔑 Step 2: Configure GitHub Secrets

Go to your **GitHub Repository** > **Settings** > **Secrets and variables** > **Actions** and click **New repository secret**.

Add the following secret names and values:

| Secret Name | Description / Example Value |
| :--- | :--- |
| `GCP_PROJECT_ID` | Your Google Cloud Project ID (e.g. `my-awesome-app-12345`) |
| `GCP_SA_KEY` | Paste the **entire content** of the downloaded Service Account JSON key. |
| `GCP_REGION` | The region of your choice (e.g. `us-central1` or `europe-west2`). |
| `GCP_SERVICE_NAME` | The desired service name on Cloud Run (e.g. `movie-review-finder`). |
| `GCP_GAR_REPOSITORY` | The name of your Artifact Registry repository (e.g. `app-images`). |
| `GCP_GAR_LOCATION` | The region of your Artifact Registry repository (e.g. `us-central1`). |

---

## 🚀 Step 3: Trigger Your First Deploy!

Once your Secrets are populated, you are ready to launch!
1. Push any commit to the `main` or `master` branch:
   ```bash
   git add .
   git commit -m "Configure production Dockerfile and CI/CD workflow"
   git push origin main
   ```
2. Navigate to your repository's **Actions** tab on GitHub to see the progress of the workflow.
3. Once completed, your new full-stack, highly optimized app will be running live on Google Cloud Run!
