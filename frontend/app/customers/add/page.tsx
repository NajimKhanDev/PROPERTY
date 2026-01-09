"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProjectApi from "@/app/api/ProjectApis";
import axiosInstance from "@/app/api/axiosInstance";

type FormValues = {
  name: string;
  email: string;
  phone: string;
  address: string;
  type: "buyer" | "seller" | "both";
  pan_number: string;
  aadhar_number: string;
  pan_file: FileList;
  aadhar_file: FileList;
};

export default function AddCustomerPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    defaultValues: {
      type: "buyer",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const formData = new FormData();

      formData.append("name", values.name);
      formData.append("email", values.email);
      formData.append("phone", values.phone);
      formData.append("address", values.address);
      formData.append("type", values.type.toUpperCase());
      formData.append("pan_number", values.pan_number);
      formData.append("aadhar_number", values.aadhar_number);

      if (values.pan_file?.[0]) {
        formData.append("pan_file_path", values.pan_file[0]);
      }

      if (values.aadhar_file?.[0]) {
        formData.append("aadhar_file_path", values.aadhar_file[0]);
      }

      await axiosInstance.post(ProjectApi.create_customers, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      router.push("/customers");
    } catch (error) {
      console.error(error);
      alert("Failed to add customer");
    }
  };

  const inputClass =
    "w-full px-3 py-2 rounded-md border border-gray-200 bg-white text-sm " +
    "focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300";

  const errorText = "text-xs text-red-600 mt-1";

  return (
    <div className="min-h-screen flex justify-center pt-12 px-4 text-black bg-gray-50">
      <div className="w-full max-w-2xl">
        {/* HEADER */}
        <div className="mb-6">
          <Link
            href="/customers"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ← Back to Customers
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-2 text-center">
            Add New Customer
          </h1>
        </div>

        {/* FORM CARD */}
        <div className="bg-white rounded-2xl shadow-md p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-sm">
            {/* Name */}
            <div>
              <label className="block font-medium mb-1">Name</label>
              <input {...register("name", { required: "Name is required" })} className={inputClass} />
              {errors.name && <p className={errorText}>{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block font-medium mb-1">Email</label>
              <input
                type="email"
                {...register("email", { required: "Email is required" })}
                className={inputClass}
              />
              {errors.email && <p className={errorText}>{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block font-medium mb-1">Phone</label>
              <input
                {...register("phone", {
                  required: "Phone number is required",
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: "Phone number must be exactly 10 digits",
                  },
                })}
                inputMode="numeric"
                className={inputClass}
              />
              {errors.phone && <p className={errorText}>{errors.phone.message}</p>}
            </div>

            {/* Address */}
            <div>
              <label className="block font-medium mb-1">Address</label>
              <textarea
                rows={3}
                {...register("address", { required: "Address is required" })}
                className={inputClass}
              />
              {errors.address && <p className={errorText}>{errors.address.message}</p>}
            </div>

            {/* Type */}
            <div>
              <label className="block font-medium mb-1">Customer Type</label>
              <select {...register("type")} className={inputClass}>
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="both">Both</option>
              </select>
            </div>

            {/* PAN */}
            <div>
              <label className="block font-medium mb-1">PAN Number</label>
              <input
                {...register("pan_number", { required: "PAN number is required" })}
                className={inputClass}
              />
              {errors.pan_number && <p className={errorText}>{errors.pan_number.message}</p>}
            </div>

            <div>
              <label className="block font-medium mb-1">PAN File</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                {...register("pan_file", { required: "PAN file is required" })}
                className="block w-full text-sm text-gray-600"
              />
              {errors.pan_file && <p className={errorText}>{errors.pan_file.message}</p>}
            </div>

            {/* Aadhaar */}
            <div>
              <label className="block font-medium mb-1">Aadhaar Number</label>
              <input
                {...register("aadhar_number", { required: "Aadhaar number is required" })}
                className={inputClass}
              />
              {errors.aadhar_number && <p className={errorText}>{errors.aadhar_number.message}</p>}
            </div>

            <div>
              <label className="block font-medium mb-1">Aadhaar File</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                {...register("aadhar_file", { required: "Aadhaar file is required" })}
                className="block w-full text-sm text-gray-600"
              />
              {errors.aadhar_file && <p className={errorText}>{errors.aadhar_file.message}</p>}
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 justify-end">
              <Link
                href="/customers"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                {isSubmitting ? "Saving..." : "Add Customer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
