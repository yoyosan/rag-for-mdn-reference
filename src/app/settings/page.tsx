"use client";

import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SettingsHeader } from "@/components/settings/Header";
import { getStorageItem, setStorageItem } from "@/lib/client/localStorage";
import { externalAIProvidersLabels } from "@/lib/shared/constants";
import {
	type ExternalAIProvider,
	externalAIProviders,
} from "@/types/aiProviders";

export default function SettingsPage() {
	const [aiProvider, setAiProvider] = useState("");
	useEffect(() => {
		setAiProvider((getStorageItem("ai-provider") || "") as ExternalAIProvider);
	}, []);

	const [apiKey, setApiKey] = useState(getStorageItem("api-key") || "");
	const [aiModel, setAiModel] = useState(getStorageItem("ai-model") || "");
	const [voyageApiKey, setVoyageApiKey] = useState(
		getStorageItem("voyage-api-key") || "",
	);
	const [embedModel, setEmbedModel] = useState(
		getStorageItem("embed-model") || "",
	);
	const [showPassword, setShowPassword] = useState(false);

	const changeProvider = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setAiProvider(e.target.value as ExternalAIProvider);
	};

	const changeApiKey = (e: React.ChangeEvent<HTMLInputElement>) => {
		setApiKey(e.target.value);
	};

	const changeAiModel = (e: React.ChangeEvent<HTMLInputElement>) => {
		setAiModel(e.target.value);
	};

	const changeVoyageApiKey = (e: React.ChangeEvent<HTMLInputElement>) => {
		setVoyageApiKey(e.target.value);
	};

	const changeEmbedModel = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEmbedModel(e.target.value);
	};

	const handleSubmit = (formData: FormData) => {
		setStorageItem("ai-provider", formData.get("ai-provider") as string);
		setStorageItem("api-key", formData.get("api-key") as string);
		setStorageItem("ai-model", formData.get("ai-model") as string);
		setStorageItem("voyage-api-key", formData.get("voyage-api-key") as string);
		setStorageItem("embed-model", formData.get("embed-model") as string);

		toast.success("Settings saved successfully! 🎉", {
			description: "Now go back to Chat and try it out.",
		});
	};

	const handleReset = () => {
		if (!window.confirm("Are you sure you want to clear all settings?")) {
			return;
		}

		setStorageItem("ai-provider", "");
		setStorageItem("api-key", "");
		setStorageItem("ai-model", "");
		setStorageItem("voyage-api-key", "");
		setStorageItem("embed-model", "");

		setAiProvider("" as ExternalAIProvider);
		setApiKey("");
		setAiModel("");
		setVoyageApiKey("");
		setEmbedModel("");
	};

	return (
		<div className="flex flex-col h-screen bg-gray-950 text-white">
			<SettingsHeader />
			<main className="flex flex-col flex-1 items-center gap-10 p-20">
				<div className="text-2xl">Settings</div>

				<form
					className="flex flex-col flex-1 gap-4 w-1/2"
					onSubmit={(e) => {
						e.preventDefault();
						handleSubmit(new FormData(e.currentTarget));
					}}
				>
					<div className="mb-4">
						<label
							htmlFor="ai-provider"
							className="block font-medium text-gray-300 text-lg"
						>
							AI Provider
						</label>
						<select
							id="ai-provider"
							name="ai-provider"
							className="mt-1 p-2 block w-full rounded-md border-gray-700 bg-[#1a1a2e] text-white"
							value={aiProvider}
							onChange={changeProvider}
							required
						>
							<option value="" disabled>
								Select a provider
							</option>
							{externalAIProviders.map((provider) => (
								<option key={provider} value={provider}>
									{externalAIProvidersLabels[provider]}
								</option>
							))}
						</select>
					</div>
					<div className="mb-4">
						<label
							htmlFor="api-key"
							className="block font-medium text-gray-300 text-lg"
						>
							AI API Key
						</label>
						<div className="relative">
							<input
								type={showPassword ? "text" : "password"}
								id="api-key"
								name="api-key"
								required
								value={apiKey}
								className="mt-1 p-2 pr-10 block w-full rounded-md border-gray-700 bg-[#1a1a2e] text-white"
								onChange={changeApiKey}
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
								aria-label={showPassword ? "Hide password" : "Show password"}
							>
								{showPassword ? (
									<EyeOff className="w-5 h-5" />
								) : (
									<Eye className="w-5 h-5" />
								)}
							</button>
						</div>
					</div>
					<div className="mb-4">
						<label
							htmlFor="ai-model"
							className="block font-medium text-gray-300 text-lg"
						>
							AI Model
						</label>
						<input
							type="text"
							id="ai-model"
							name="ai-model"
							required
							value={aiModel}
							className="mt-1 p-2 pr-10 block w-full rounded-md border-gray-700 bg-[#1a1a2e] text-white"
							onChange={changeAiModel}
						/>
					</div>
					<div className="mb-4">
						<label
							htmlFor="voyage-api-key"
							className="block font-medium text-gray-300 text-lg"
						>
							Voyage API Key
						</label>
						<div className="relative">
							<input
								type={showPassword ? "text" : "password"}
								id="voyage-api-key"
								name="voyage-api-key"
								required
								value={voyageApiKey}
								className="mt-1  p-2 block w-full rounded-md border-gray-700 bg-[#1a1a2e] text-white"
								onChange={changeVoyageApiKey}
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
								aria-label={showPassword ? "Hide password" : "Show password"}
							>
								{showPassword ? (
									<EyeOff className="w-5 h-5" />
								) : (
									<Eye className="w-5 h-5" />
								)}
							</button>
						</div>
					</div>
					<div className="mb-4">
						<label
							htmlFor="embed-model"
							className="block font-medium text-gray-300 text-lg"
						>
							Embedding Model
						</label>
						<input
							type="text"
							id="embed-model"
							name="embed-model"
							required
							value={embedModel}
							className="mt-1 p-2 pr-10 block w-full rounded-md border-gray-700 bg-[#1a1a2e] text-white"
							onChange={changeEmbedModel}
						/>
					</div>
					<div className="mb-4 flex gap-2">
						<button
							type="submit"
							className="p-2 block w-full rounded-md border-gray-700 bg-purple-600 text-white"
						>
							Save
						</button>
						<button
							type="button"
							className="p-2 block w-full rounded-md border-gray-700 bg-red-700 text-white"
							onClick={handleReset}
						>
							Clear
						</button>
					</div>
				</form>
			</main>
		</div>
	);
}
