<h1>FlowGuard</h1>
<h4>A centralised workspace with activities for small businesses</h4>

<table>
<h1> Team Information </h1>
  <tr>
    <th>Team Name</th>
    <th>Avengers</th>
  </tr>
  
  <tr>
    <td>Team Domain</td>
    <td>Domain 2</td>
  </tr>
  
  <tr>
    <td>Team Leader</td>
    <td>Dayanitha</td>
  </tr>

  <tr>
    <td>University</td>
    <td>Asia Pacific University (APU)</td>
  </tr>

  <tr>
    <td>Number Of  Members</td>
    <td>5 members</td>
  </tr>
</table>

<table>
<h1> Links </h1>
  <tr>
    <th>GitHub Respitory </th>
    <th>https://github.com/Elliott7710/Avengers</th>
  </tr>
  
  <tr>
    <td>Replit Project</td>
    <td>empty</td>
  </tr>
  
  <tr>
    <td>Live Demo</td>
    <td>Empty </td>
  </tr>

  <tr>
    <td>RunPod Endpoint</td>
    <td>Empty</td>
  </tr>

  <tr>
    <td>Slide Decks</td>
    <td>Empty</td>
  </tr>

  <tr>
    <td>Demo Video</td>
    <td>Demo Video</td>
  </tr>
</table>

## How to Run

### Option 1 — Run on Replit (Recommended)

1. Open the [Replit Project](https://github.com/Elliott7710/Avengers), or import this repository via **Create Repl → Import from GitHub**.
2. Open the **Secrets** tab (🔒) and add the variables listed in `.env.example`:
   - `RUNPOD_API_KEY`
   - `RUNPOD_ENDPOINT_ID`
3. Click **Run**. Replit uses the `.replit` file to start `python src/main.py`.

### Option 2 — Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/your-username/your-project.git
cd your-project

# 2. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
cp .env.example .env            # then fill in your values

# 5. Run the app
python src/main.py
```

### Run Tests

```bash
python -m unittest discover tests
```

---

## How We Use Replit *(Required)*

Describe how your team used Replit. For example:

- **Development:** Collaborative coding in a shared Repl using Multiplayer.
- **Hosting:** The app is deployed with Replit Deployments at the Live Demo link above.
- **Secrets:** API keys are stored in Replit Secrets, never in the code.

📄 Proof of use: [`submission/SDC2026_TeamName_Replit_POU.pdf`](submission/SDC2026_TeamName_Replit_POU.pdf)

## How We Use RunPod *(Required)*

Describe how your team used RunPod. For example:

- **Workload:** Model inference (e.g. text generation, image processing) runs on a RunPod GPU.
- **Setup:** `runpod/handler.py` is deployed as a **RunPod Serverless Endpoint**.
- **Integration:** The Replit app sends requests to the endpoint using `RUNPOD_API_KEY` and `RUNPOD_ENDPOINT_ID`.

Example request:

```bash
curl -X POST https://api.runpod.ai/v2/$RUNPOD_ENDPOINT_ID/runsync \
  -H "Authorization: Bearer $RUNPOD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input": {"prompt": "Hello"}}'
```

📄 Proof of use: [`submission/SDC2026_TeamName_Runpod_POU.pdf`](submission/SDC2026_TeamName_Runpod_POU.pdf)

---

## Challenges & Learnings

- What challenges did you face, and how did you overcome them?
- What did your team learn?

## Future Improvements

- [ ] Improvement 1
- [ ] Improvement 2

## Team

| Name        | Role                | GitHub                                     |
| ----------- | ------------------- | ------------------------------------------ |
| Soo Jun Hin | Team Lead / Backend | [@Elliott](https://github.com/Elliott7710) |
| Soo Jun Hin | Frontend            | [@Elliott](https://github.com/Elliott7710) |
| Soo Jun Hin | AI / RunPod         | [@Elliott](https://github.com/Elliott7710) |

---

## Submission Checklist

- [✓] Team name, domain (Domain 1 / Domain 2) and SDG track filled in
- [ ] Slide deck link added
- [ ] Demo video link added
- [✓] Replit used, with proof of use in `submission/`
- [✓] RunPod used, with proof of use in `submission/`
- [ ] Preliminary submission completed (`SDC2026_TeamName_Preliminary.pdf`)
- [ ] Technology declaration completed (`SDC2026_TeamName_TechDeclaration.pdf`)
- [ ] Submission files renamed with your team name (replace `TeamName`)
- [ ] "How to Run" steps verified
- [✓] No API keys or secrets committed to the repository

## License

This project is licensed under the [Apache License 2.0](LICENSE).
